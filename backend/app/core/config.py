import os
from pathlib import Path

APP_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = APP_DIR.parent / "data"
DATA_FILE = DATA_DIR / "questions_en.json"
EXPORTS_DIR = APP_DIR.parent / "exports"
ATTEMPTS_INDEX_FILE = DATA_DIR / "attempts.json"
DUMMYJSON_URL = "https://dummyjson.com"
AUTH_COOKIE_NAME = "janeq_access_token"
AUTH_COOKIE_SECURE = os.getenv("AUTH_COOKIE_SECURE", "false").lower() == "true"
AUTH_COOKIE_SAMESITE = os.getenv("AUTH_COOKIE_SAMESITE", "lax").lower()
TRUSTED_ORIGINS = {
    origin.strip()
    for origin in os.getenv(
        "TRUSTED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
}

if AUTH_COOKIE_SAMESITE not in {"lax", "strict", "none"}:
    raise ValueError("AUTH_COOKIE_SAMESITE must be 'lax', 'strict', or 'none'")
if AUTH_COOKIE_SAMESITE == "none" and not AUTH_COOKIE_SECURE:
    raise ValueError("AUTH_COOKIE_SECURE must be true when AUTH_COOKIE_SAMESITE is 'none'")
