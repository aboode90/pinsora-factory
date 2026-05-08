import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

TOKEN = os.getenv("PINTEREST_ACCESS_TOKEN")

def get_boards():
    if not TOKEN:
        print("❌ Error: PINTEREST_ACCESS_TOKEN is missing in .env file!")
        return

    print("🔍 Fetching Pinterest Boards...")
    url = "https://api.pinterest.com/v5/boards"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

    try:
        res = requests.get(url, headers=headers)
        data = res.json()
        
        if "items" in data:
            print("\n✅ Found these boards:")
            for board in data["items"]:
                print(f"📌 Name: {board['name']} | ID: {board['id']}")
            print("\n👉 Copy the ID of 'Pin sora' and paste it into PINTEREST_BOARD_ID in your .env file.")
        else:
            print(f"❌ Pinterest API Error: {data}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    get_boards()
