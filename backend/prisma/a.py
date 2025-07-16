import requests
import time
from pprint import pprint
import json 

API_KEY = "JU-t61af8Wn2x9yMX9JPc21nulGv3AtOmxpy-KHuP9xfdcP66JY"
MATCH_ID = 1199347
OUTPUT_FILE = f"match_{MATCH_ID}.json"

url = f"https://api.pandascore.co/matches/{MATCH_ID}"

headers = {
    "Authorization": f"Bearer {API_KEY}"
}

response = requests.get(url, headers=headers)

if response.status_code == 200:
    data = response.json()

    # Dump dans un fichier .json lisible
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Match {MATCH_ID} récupéré avec succès et enregistré dans {OUTPUT_FILE}")
else:
    print(f"❌ Erreur {response.status_code} lors de la récupération du match.")
