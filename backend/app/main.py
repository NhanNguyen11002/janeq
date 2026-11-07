import json
import os
import tempfile
import threading
import uuid
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

APP_DIR = Path(__file__).resolve().parent
DATA_FILE = APP_DIR.parent / "data" / "questions_en.json"
EXPORTS_DIR = APP_DIR.parent / "exports"
ATTEMPTS_INDEX_FILE = APP_DIR.parent / "data" / "attempts.json"
DUMMYJSON_URL = "https://dummyjson.com"

_attempts_lock = threading.Lock()
_bearer_scheme = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class AttemptSubmission(BaseModel):
    category: str = Field(min_length=1)
    answers: dict[str, str] = Field(default_factory=dict)


def load_questions() -> list[dict[str, Any]]:
    try:
        with DATA_FILE.open(encoding="utf-8") as file:
            data = json.load(file)
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Unable to load question data from {DATA_FILE}: {error}") from error

    questions = data.get("questions") if isinstance(data, dict) else None
    if not isinstance(questions, list):
        raise RuntimeError("Question data must contain a 'questions' array")

    for index, question in enumerate(questions, start=1):
        if not isinstance(question, dict):
            raise RuntimeError(f"Question {index} must be an object")

        category = question.get("type")
        text = question.get("question")
        options = question.get("options")
        answer = question.get("answer")
        if not isinstance(category, str) or not category.strip():
            raise RuntimeError(f"Question {index} has no valid type")
        if not isinstance(text, str) or not text.strip():
            raise RuntimeError(f"Question {index} has no valid question text")
        if not isinstance(options, list) or not options or not all(
            isinstance(option, str) for option in options
        ):
            raise RuntimeError(f"Question {index} must have a non-empty string options array")
        if answer not in options:
            raise RuntimeError(f"Question {index} answer must match one of its options")

    return questions


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


questions = load_questions()
app = FastAPI(title="JaneQ API", version="0.2.0")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{DUMMYJSON_URL}/auth/me",
                headers={"Authorization": f"Bearer {credentials.credentials}"},
            )
    except httpx.RequestError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service is unavailable",
        ) from error

    if response.status_code in (401, 403):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not response.is_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service returned an error",
        )
    try:
        user = response.json()
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service returned invalid data",
        ) from error

    if not isinstance(user, dict) or not isinstance(user.get("id"), int):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service returned an invalid user",
        )
    return user


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/login")
async def login(request: LoginRequest) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{DUMMYJSON_URL}/auth/login",
                json={"username": request.username, "password": request.password},
            )
    except httpx.RequestError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service is unavailable",
        ) from error

    if response.status_code in (400, 401, 403, 404):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not response.is_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service returned an error",
        )
    try:
        login_data = response.json()
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service returned invalid data",
        ) from error

    if (
        not isinstance(login_data, dict)
        or not isinstance(login_data.get("id"), int)
        or not isinstance(login_data.get("accessToken"), str)
    ):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service returned an invalid login response",
        )
    return login_data


@app.get("/api/categories")
def get_categories() -> dict[str, list[dict[str, Any]]]:
    counts = Counter(question["type"] for question in questions)
    return {
        "categories": [
            {"name": name, "question_count": count}
            for name, count in counts.items()
        ]
    }


@app.get("/api/questions")
def get_questions(
    category: str = Query(min_length=1),
) -> dict[str, list[dict[str, Any]]]:
    selected = [
        {
            "id": f"question-{index:03d}",
            "question": question["question"],
            "options": question["options"],
        }
        for index, question in enumerate(questions, start=1)
        if question["type"] == category
    ]
    if not selected:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"questions": selected}


@app.post("/api/attempts", status_code=status.HTTP_201_CREATED)
def submit_attempt(
    submission: AttemptSubmission,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    category_questions = [
        (index, question)
        for index, question in enumerate(questions, start=1)
        if question["type"] == submission.category
    ]
    if not category_questions:
        raise HTTPException(status_code=404, detail="Category not found")

    valid_question_ids = {
        f"question-{index:03d}": question for index, question in category_questions
    }
    unknown_question_ids = set(submission.answers) - set(valid_question_ids)
    if unknown_question_ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Answers contain question IDs outside this category: {sorted(unknown_question_ids)}",
        )

    results = []
    for question_id, question in valid_question_ids.items():
        selected_answer = submission.answers.get(question_id)
        if selected_answer is not None and selected_answer not in question["options"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Selected answer is not an option for {question_id}",
            )
        correct_answer = question["answer"]
        results.append(
            {
                "questionId": question_id,
                "question": question["question"],
                "selectedAnswer": selected_answer,
                "correctAnswer": correct_answer,
                "isCorrect": selected_answer == correct_answer,
            }
        )

    total_questions = len(results)
    score = sum(result["isCorrect"] for result in results)
    attempt_id = str(uuid.uuid4())
    attempt = {
        "attemptId": attempt_id,
        "userId": user["id"],
        "category": submission.category,
        "submittedAt": datetime.now(timezone.utc).isoformat(),
        "score": score,
        "totalQuestions": total_questions,
        "percentage": round(score / total_questions * 100, 2),
        "results": results,
    }
    attempt_file = EXPORTS_DIR / f"{attempt_id}.json"

    with _attempts_lock:
        try:
            users = read_attempts_index()
        except RuntimeError as error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to read attempts index",
            ) from error
        user_id = str(user["id"])
        user_attempts = users.setdefault(user_id, [])
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

    return attempt


@app.get("/api/attempts")
def get_attempt_history(
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, list[dict[str, Any]]]:
    try:
        users = read_attempts_index()
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to read attempts index",
        ) from error

    attempt_ids = users.get(str(user["id"]), [])
    attempts = [read_attempt(attempt_id) for attempt_id in attempt_ids]
    return {"attempts": attempts}


def get_owned_attempt(
    attempt_id: str,
    user: dict[str, Any],
) -> tuple[dict[str, Any], Path]:
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


@app.get("/api/attempts/{attempt_id}")
def get_attempt(
    attempt_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    attempt, _ = get_owned_attempt(attempt_id, user)
    return attempt


@app.get("/api/attempts/{attempt_id}/export")
def export_attempt(
    attempt_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> FileResponse:
    attempt, attempt_file = get_owned_attempt(attempt_id, user)
    return FileResponse(
        path=attempt_file,
        media_type="application/json",
        filename=f"attempt-{attempt['attemptId']}.json",
    )
