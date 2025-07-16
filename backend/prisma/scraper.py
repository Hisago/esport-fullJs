import sqlite3
import requests
import json
import time
from datetime import datetime
from dateutil import parser

API_KEY = "JU-t61af8Wn2x9yMX9JPc21nulGv3AtOmxpy-KHuP9xfdcP66JY"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}
DATABASE_PATH = "dev.db"

ACCEPTED_SLUGS = [
    "league-of-legends-emea-masters",
    "league-of-legends-esports-world-cup",
    "league-of-legends-first-stand",
    "league-of-legends-lck-champions-korea",
    "league-of-legends-lcp",
    "league-of-legends-lec",
    "league-of-legends-lfl",
    "league-of-legends-lfl-division-2",
    "league-of-legends-lpl-china",
    "league-of-legends-lta",
    "league-of-legends-lta-north",
    "league-of-legends-lta-south",
    "league-of-legends-mid-invitational",
    "league-of-legends-vcs"
]

CURRENT_YEAR = datetime.now().year

def get_bracket_type(match_name: str) -> str:
    name = match_name.lower()
    if "lower bracket" in name or "loser bracket" in name:
        return "lower"
    if "upper bracket" in name or "winner bracket" in name:
        return "upper"
    return "unknown"

def fetch_paginated_data(url, params={}, max_retries=3):
    all_data = []
    page = 1
    retries = 0
    while True:
        params.update({"page": page, "per_page": 50})
        try:
            res = requests.get(url, headers=HEADERS, params=params)
            if res.status_code == 429:
                time.sleep(10)
                retries += 1
                if retries > max_retries:
                    break
                continue
            elif res.status_code >= 500:
                break
            res.raise_for_status()
        except Exception as e:
            break
        data = res.json()
        if not data:
            break
        all_data.extend(data)
        page += 1
        time.sleep(1)
    return all_data

def insert_game():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO Game (name, slug) VALUES ('League of Legends', 'league-of-legends')")
    conn.commit()
    cursor.execute("SELECT id FROM Game WHERE slug = 'league-of-legends'")
    game_id = cursor.fetchone()[0]
    conn.close()
    return game_id

def insert_data(game_id):
    leagues = fetch_paginated_data("https://api.pandascore.co/leagues")
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    for league in leagues:
        if league.get("videogame", {}).get("slug") != "league-of-legends":
            continue
        if league["slug"] not in ACCEPTED_SLUGS:
            continue

        cursor.execute("""
            INSERT OR IGNORE INTO League (api_id, name, slug, region, logo_url, game_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            league["id"], league["name"], league["slug"],
            league["slug"].split("-")[-1], league.get("image_url"), game_id
        ))

        cursor.execute("SELECT id FROM League WHERE api_id = ?", (league["id"],))
        row = cursor.fetchone()
        if not row:
            continue
        db_league_id = row[0]

        tournaments = fetch_paginated_data(f"https://api.pandascore.co/leagues/{league['id']}/tournaments")
        tournaments = [
            t for t in tournaments
            if t.get("begin_at") and parser.isoparse(t["begin_at"]).year == CURRENT_YEAR
        ]

        for t in tournaments:
            cursor.execute("""
                INSERT INTO Tournament (api_id, name, slug, begin_at, end_at, location, logo_url, game_id, league_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(api_id) DO UPDATE SET
                  name = excluded.name,
                  slug = excluded.slug,
                  begin_at = excluded.begin_at,
                  end_at = excluded.end_at,
                  location = excluded.location,
                  logo_url = excluded.logo_url,
                  game_id = excluded.game_id,
                  league_id = excluded.league_id
            """, (
                t["id"], t["name"], t["slug"], t.get("begin_at"), t.get("end_at"),
                t.get("location"), league.get("image_url"), game_id, db_league_id
            ))

        tournament_id_to_stage = {t["id"]: t.get("name", "Inconnu") for t in tournaments}
        tournament_ids = {t["id"] for t in tournaments}

        matches = fetch_paginated_data(f"https://api.pandascore.co/leagues/{league['id']}/matches")
        valid_matches = [
            m for m in matches
            if len(m.get("opponents", [])) == 2
            and m.get("begin_at")
            and parser.isoparse(m["begin_at"]).year == CURRENT_YEAR
            and m.get("tournament", {}).get("id") in tournament_ids
        ]

        team_api_to_local_id = {}

        for match in valid_matches:
            team1 = match["opponents"][0]["opponent"]
            team2 = match["opponents"][1]["opponent"]
            if not team1 or not team2:
                continue

            for team in [team1, team2]:
                if team["id"] not in team_api_to_local_id:
                    cursor.execute("SELECT id FROM Team WHERE json_extract(data, '$.api_id') = ? AND game_id = ?", (team["id"], game_id))
                    existing = cursor.fetchone()
                    if not existing:
                        data = json.dumps({"api_id": team["id"], "acronym": team.get("acronym"), "slug": team.get("slug")})
                        cursor.execute("""
                            INSERT INTO Team (name, logo_url, league_id, data, game_id)
                            VALUES (?, ?, ?, ?, ?)
                        """, (team["name"], team.get("image_url"), db_league_id, data, game_id))
                        cursor.execute("SELECT last_insert_rowid()")
                        team_api_to_local_id[team["id"]] = cursor.fetchone()[0]
                    else:
                        team_api_to_local_id[team["id"]] = existing[0]

            score1 = score2 = None
            for res in match.get("results", []):
                if res.get("team_id") == team1["id"]:
                    score1 = res.get("score")
                elif res.get("team_id") == team2["id"]:
                    score2 = res.get("score")

            tournament_api_id = match.get("tournament", {}).get("id")
            cursor.execute("SELECT id FROM Tournament WHERE api_id = ?", (tournament_api_id,))
            tournament_row = cursor.fetchone()
            if not tournament_row:
                continue

            local_tournament_id = tournament_row[0]
            stage = tournament_id_to_stage.get(tournament_api_id, "Inconnu")
            match_type_raw = match.get("match_type")
            match_type = f"BO{match.get('number_of_games', 1)}" if match_type_raw == "best_of" else None
            status = match.get("status")
            number_of_games = match.get("number_of_games")
            bracket = get_bracket_type(match.get("name", ""))

            cursor.execute("""
            INSERT INTO Match (
                api_id, league_id, team1_id, team2_id,
                team1_api_id, team2_api_id, date,
                score_team1, score_team2, stage, match_type,
                status, number_of_games, tournament_id, bracket
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(api_id) DO UPDATE SET
                league_id = excluded.league_id,
                team1_id = excluded.team1_id,
                team2_id = excluded.team2_id,
                team1_api_id = excluded.team1_api_id,
                team2_api_id = excluded.team2_api_id,
                date = excluded.date,
                score_team1 = excluded.score_team1,
                score_team2 = excluded.score_team2,
                stage = excluded.stage,
                match_type = excluded.match_type,
                status = excluded.status,
                number_of_games = excluded.number_of_games,
                tournament_id = excluded.tournament_id,
                bracket = excluded.bracket
        """, (
            match["id"], db_league_id,
            team_api_to_local_id[team1["id"]],
            team_api_to_local_id[team2["id"]],
            team1["id"], team2["id"], match["begin_at"],
            score1, score2, stage, match_type,
            status, number_of_games, local_tournament_id, bracket
        ))

    conn.commit()
    conn.close()

def main():
    game_id = insert_game()
    insert_data(game_id)
    print("\n✅ Import terminé : ligues + tournois + équipes + matchs avec bracket.")

if __name__ == "__main__":
    main()
