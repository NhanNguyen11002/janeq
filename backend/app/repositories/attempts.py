import json
import os
import tempfile
import threading
import uuid
from pathlib import Path
from typing import Any

from fastapi import HTTPException, status

from app.core.config import ATTEMPTS_INDEX_FILE, EXPORTS_DIR

_attempts_lock = threading.Lock()


def read_attempts_index() -> dict[str, list[str]]:
    try:
        with ATTEMPTS_INDEX_FILE.open(encoding="utf-8") as file:
            data = json.load(file)
    except FileNotFoundError:
        return {}
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Unable to read attempts index {ATTEMPTS_INDEX_FILE}: {error}") from error

    users = data.get("users") if isinstance(data, dict) else None
    if not isinstance(users, dict) or any(
        not isinstance(user_id, str)
        or not isinstance(attempt_ids, list)
        or not all(isinstance(attempt_id, str) for attempt_id in attempt_ids)
        for user_id, attempt_ids in users.items()
    ):
        raise RuntimeError("Attempts index must have the shape {'users': {userId: [attemptId, ...]}}")
    return users


def write_json_atomic(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as file:
            temporary_path = file.name
            json.dump(data, file, ensure_ascii=False, indent=2)
            file.write("\n")
        os.chmod(temporary_path, 0o644)
        os.replace(temporary_path, path)
    except OSError:
        if temporary_path is not None:
            try:
                os.unlink(temporary_path)
            except FileNotFoundError:
                pass
        raise


def save_attempt(attempt: dict[str, Any]) -> None:
    attempt_id = attempt["attemptId"]
    attempt_file = EXPORTS_DIR / f"{attempt_id}.json"

    with _attempts_lock:
        try:
            users = read_attempts_index()
        except RuntimeError as error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to read attempts index",
            ) from error

        user_attempts = users.setdefault(str(attempt["userId"]), [])
        attempt_saved = False
        try:
            write_json_atomic(attempt_file, attempt)
            attempt_saved = True
            user_attempts.append(attempt_id)
            write_json_atomic(ATTEMPTS_INDEX_FILE, {"users": users})
        except OSError as error:
            if attempt_id in user_attempts:
                user_attempts.remove(attempt_id)
            if attempt_saved:
                try:
                    attempt_file.unlink(missing_ok=True)
                except OSError as cleanup_error:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Unable to save attempt or clean up its export file",
                    ) from cleanup_error
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to save attempt",
            ) from error


def read_attempt(attempt_id: str) -> dict[str, Any]:
    try:
        normalized_id = str(uuid.UUID(attempt_id))
    except ValueError as error:
        raise HTTPException(status_code=404, detail="Attempt not found") from error

    attempt_file = EXPORTS_DIR / f"{normalized_id}.json"
    try:
        with attempt_file.open(encoding="utf-8") as file:
            attempt = json.load(file)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail="Attempt not found") from error
    except (OSError, json.JSONDecodeError) as error:
        raise HTTPException(status_code=500, detail="Unable to read saved attempt") from error
    if not isinstance(attempt, dict) or attempt.get("attemptId") != normalized_id:
        raise HTTPException(status_code=500, detail="Saved attempt has an invalid format")
    return attempt


def get_owned_attempt(attempt_id: str, user: dict[str, Any]) -> tuple[dict[str, Any], Path]:
    try:
        normalized_id = str(uuid.UUID(attempt_id))
    except ValueError as error:
        raise HTTPException(status_code=404, detail="Attempt not found") from error

    try:
        users = read_attempts_index()
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to read attempts index",
        ) from error
    if normalized_id not in users.get(str(user["id"]), []):
        raise HTTPException(status_code=404, detail="Attempt not found")

    attempt_file = EXPORTS_DIR / f"{normalized_id}.json"
    attempt = read_attempt(normalized_id)
    if attempt.get("userId") != user["id"]:
        raise HTTPException(status_code=404, detail="Attempt not found")
    return attempt, attempt_file
