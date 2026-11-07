from pathlib import Path

APP_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = APP_DIR.parent / "data"
DATA_FILE = DATA_DIR / "questions_en.json"
EXPORTS_DIR = APP_DIR.parent / "exports"
ATTEMPTS_INDEX_FILE = DATA_DIR / "attempts.json"
DUMMYJSON_URL = "https://dummyjson.com"
