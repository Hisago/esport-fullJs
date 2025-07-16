
import sqlite3
import requests
import json
import time
from datetime import datetime
import dateutil.parser
import re

API_KEY = "JU-t61af8Wn2x9yMX9JPc21nulGv3AtOmxpy-KHuP9xfdcP66JY"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "User-Agent": "Mozilla/5.0"}
DATABASE_PATH = "dev.db"
CURRENT_YEAR = datetime.now().year
IMPORTANT_KEYWORDS = ["major", "blast", "iem", "esl"]

def fetch_paginated_data(url, params={}, max_pages=3):
    all_data = []
    page = 1
    while page <= max_pages:
        params.update({"page": page, "per_page": 50})
        print(f"🌐 {url}?page={page}")
        res = requests.get(url, headers=HEADERS, params=params)
        if res.status_code != 200:
            print(f"❌ Erreur {res.status_code} sur {url}")
            break
        data = res.json()
        if not data:
            break
        all_data.extend(data)
        page += 1
        time.sleep(1)
    return all_data

def get_or_create_cs_game_id():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO Game (name, slug) VALUES (?, ?)", ("Counter-Strike", "counter-strike"))
    conn.commit()
    cursor.execute("SELECT id FROM Game WHERE slug = 'counter-strike'")
    game_id = cursor.fetchone()[0]
    conn.close()
    return game_id

def extract_stage(match_name):
    name = match_name.lower()
    if "stage 2" in name:
        return "Stage 2"
    elif "grand final" in name:
        return "Grande Finale"
    elif "semi" in name:
        return "Demi-finale"
    elif "quarter" in name:
        return "Quart de finale"
    elif "lower bracket" in name:
        return "Lower Bracket"
    elif "upper bracket" in name:
        return "Upper Bracket"
    elif re.search(r'\bfinal\b', name):
        return "Finale"
    elif "round" in name:
        return "Round"
    else:
        return None

def insert_all_csgo():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    game_id = get_or_create_cs_game_id()

    all_tournaments = []
    for t_type in ["upcoming", "past", "running"]:
        url = f"https://api.pandascore.co/csgo/tournaments/{t_type}"
        all_tournaments.extend(fetch_paginated_data(url))

    for t in all_tournaments:
        if not any(k in (t.get("slug", "") + t.get("name", "")).lower() for k in IMPORTANT_KEYWORDS):
            continue

        print(f"🏆 Tournoi : {t['name']} ({t['slug']})")

        league_id = t["league"]["id"] if t.get("league") else None
        serie_id = t["serie"]["id"] if t.get("serie") else None

        cursor.execute("""
            INSERT OR IGNORE INTO Tournament (
                api_id, name, slug, begin_at, end_at, location, logo_url,
                league_id, league_name, serie_id, serie_name, game_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            t["id"], t["name"], t["slug"], t.get("begin_at"), t.get("end_at"),
            t.get("location", ""), t.get("league", {}).get("image_url"),
            league_id, t["league"]["name"] if t.get("league") else None,
            serie_id, t["serie"]["name"] if t.get("serie") else None, game_id
        ))

        cursor.execute("SELECT id FROM Tournament WHERE api_id = ?", (t["id"],))
        local_tournament_id = cursor.fetchone()[0]

        matches = fetch_paginated_data("https://api.pandascore.co/csgo/matches",
                                       params={"filter[tournament_id]": t["id"]}, max_pages=2)

        for match in matches:
            if len(match.get("opponents", [])) < 2:
                continue

            team1 = match["opponents"][0]["opponent"]
            team2 = match["opponents"][1]["opponent"]
            if not team1 or not team2:
                continue

            for team in [team1, team2]:
                cursor.execute("SELECT id FROM Team WHERE json_extract(data, '$.api_id') = ?", (team["id"],))
                if not cursor.fetchone():
                    data = json.dumps({
                        "api_id": team["id"],
                        "acronym": team.get("acronym"),
                        "slug": team.get("slug")
                    })
                    cursor.execute("INSERT INTO Team (name, logo_url, game_id, data) VALUES (?, ?, ?, ?)",
                                   (team["name"], team.get("image_url"), game_id, data))

            cursor.execute("SELECT id FROM Team WHERE json_extract(data, '$.api_id') = ?", (team1["id"],))
            db_team1 = cursor.fetchone()
            cursor.execute("SELECT id FROM Team WHERE json_extract(data, '$.api_id') = ?", (team2["id"],))
            db_team2 = cursor.fetchone()

            if not db_team1 or not db_team2:
                continue

            score1 = score2 = None
            for res in match.get("results", []):
                if res["team_id"] == team1["id"]:
                    score1 = res["score"]
                elif res["team_id"] == team2["id"]:
                    score2 = res["score"]

            print(f"   🎮 Match : {team1['name']} vs {team2['name']} | 📅 {match.get('begin_at')}")
            match_type_raw = match.get("match_type")
            match_type = f"BO{match.get('number_of_games', 1)}" if match_type_raw == "best_of" else None
            status = match.get("status")
            number_of_games = match.get("number_of_games")

            cursor.execute("""
                INSERT INTO Match (
                    api_id, league_id, tournament_id, team1_id, team2_id,
                    team1_api_id, team2_api_id, date,
                    status, match_type, number_of_games, winner_api_id,
                    score_team1, score_team2, slug, stage
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(api_id) DO UPDATE SET
                    status = excluded.status,
                    score_team1 = excluded.score_team1,
                    score_team2 = excluded.score_team2,
                    winner_api_id = excluded.winner_api_id,
                    stage = excluded.stage,
                    date = excluded.date
            """, (
                match["id"], league_id, local_tournament_id,
                db_team1[0], db_team2[0],
                team1["id"], team2["id"],
                match.get("begin_at"), match.get("status"), match_type,
                match.get("number_of_games"), match.get("winner_id"),
                score1, score2, match.get("slug"),
                extract_stage(match.get("name", ""))
            ))

    conn.commit()
    conn.close()
    print("\n✅ CS:GO matchs et équipes insérés avec succès.")

if __name__ == "__main__":
    insert_all_csgo()
