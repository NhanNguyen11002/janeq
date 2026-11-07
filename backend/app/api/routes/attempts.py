from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from app.api.dependencies import get_current_user
from app.core.config import EXPORTS_DIR
from app.repositories.attempts import get_owned_attempt, read_attempt, read_attempts_index
from app.repositories.questions import questions
from app.schemas.attempts import AttemptSubmission
from app.services.attempts import create_attempt

router = APIRouter(prefix="/api/attempts")


@router.post("", status_code=status.HTTP_201_CREATED)
def submit_attempt(
    submission: AttemptSubmission,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    return create_attempt(submission, user, questions)


@router.get("")
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


@router.get("/{attempt_id}")
def get_attempt(
    attempt_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    attempt, _ = get_owned_attempt(attempt_id, user)
    return attempt


@router.get("/{attempt_id}/export")
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
