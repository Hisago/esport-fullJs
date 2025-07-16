import sqlite3
import requests
import json
import time
import argparse

API_KEY = "JU-t61af8Wn2x9yMX9JPc21nulGv3AtOmxpy-KHuP9xfdcP66JY"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}
DATABASE_PATH = "/home/quentin/laravel-project/database/database.sqlite"

def recreate_players_table(conn):
    cursor = conn.cursor()
    print("🧨 Réinitialisation de la table players...")
    cursor.executescript("""
        DROP TABLE IF EXISTS Player;

        CREATE TABLE Player (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            api_id INTEGER UNIQUE,
            name TEXT,
            role TEXT,
            nationality TEXT,
            team_id INTEGER,
            picture_url TEXT,
            game_id INTEGER,
            FOREIGN KEY (team_id) REFERENCES teams(id),
            FOREIGN KEY (game_id) REFERENCES games(id)
        );
    """)
    conn.commit()
    print("✅ Table players recréée.\n")

def fetch_players_for_all_teams(game_slug=None):
    conn = sqlite3.connect(DATABASE_PATH)
    recreate_players_table(conn)
    cursor = conn.cursor()

    if game_slug:
        print(f"🎮 Filtrage pour le jeu : {game_slug}")
        cursor.execute("""
            SELECT teams.id, teams.data, games.id as game_id
            FROM Teams
            JOIN games ON games.id = teams.game_id
            WHERE games.slug = ?
        """, (game_slug,))
    else:
        cursor.execute("""
            SELECT teams.id, teams.data, games.id as game_id
            FROM Teams
            JOIN games ON games.id = teams.game_id
        """)

    teams = cursor.fetchall()
    total_inserted = 0

    for team_id, data_json, game_id in teams:
        try:
            data = json.loads(data_json)
            api_id = data.get("api_id")
            if not api_id:
                continue

            url = f"https://api.pandascore.co/teams/{api_id}"
            res = requests.get(url, headers=HEADERS)
            if res.status_code != 200:
                print(f"❌ Team {api_id} - Erreur {res.status_code}")
                continue

            team_data = res.json()
            players = team_data.get("players", [])

            inserted = 0
            for player in players:
                cursor.execute("""
                    INSERT INTO Player (api_id, name, role, nationality, team_id, picture_url, game_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(api_id) DO UPDATE SET
                        name = excluded.name,
                        role = excluded.role,
                        nationality = excluded.nationality,
                        team_id = excluded.team_id,
                        picture_url = excluded.picture_url,
                        game_id = excluded.game_id
                """, (
                    player.get("id"),
                    player.get("name"),
                    player.get("role"),
                    player.get("nationality"),
                    team_id,
                    player.get("image_url"),
                    game_id
                ))
                inserted += 1

            total_inserted += inserted
            print(f"✅ Team {api_id} : {inserted} joueurs traités")
            time.sleep(0.5)

        except Exception as e:
            print(f"⚠️ Erreur équipe {team_id} : {e}")

    conn.commit()
    conn.close()
    print(f"\n🟢 Terminé. Joueurs insérés ou mis à jour : {total_inserted}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--game", help="Slug du jeu (ex: csgo, league-of-legends)")
    args = parser.parse_args()

    fetch_players_for_all_teams(game_slug=args.game)
