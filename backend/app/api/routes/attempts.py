from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse

from app.api.dependencies import get_current_user, validate_request_origin
from app.repositories.attempts import get_owned_attempt, read_attempt, read_attempts_index
from app.repositories.questions import questions
from app.schemas.attempts import AttemptSubmission
from app.services.attempts import create_attempt

router = APIRouter(prefix="/api/attempts")


def add_legacy_question_options(attempt: dict[str, Any]) -> dict[str, Any]:
    result = dict(attempt)
    results = []
    for item in attempt.get("results", []):
        result_item = dict(item)
        if not isinstance(result_item.get("options"), list):
            try:
                question_number = int(result_item["questionId"].removeprefix("question-"))
                question = questions[question_number - 1]
            except (KeyError, ValueError, IndexError, TypeError):
                question = None

            if (
                question is not None
                and question["type"] == attempt.get("category")
                and question["question"] == result_item.get("question")
            ):
                result_item["options"] = question["options"]
        results.append(result_item)

    result["results"] = results
    return result


@router.post("", status_code=status.HTTP_201_CREATED)
def submit_attempt(
    request: Request,
    submission: AttemptSubmission,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    validate_request_origin(request)
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
    attempts.sort(key=lambda attempt: attempt.get("submittedAt", ""), reverse=True)
    attempts = [
        {
            key: attempt[key]
            for key in (
                "attemptId",
                "category",
                "submittedAt",
                "score",
                "totalQuestions",
                "percentage",
            )
            if key in attempt
        }
        for attempt in attempts
    ]
    return {"attempts": attempts}


@router.get("/{attempt_id}")
def get_attempt(
    attempt_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    attempt, _ = get_owned_attempt(attempt_id, user)
    return add_legacy_question_options(attempt)


@router.get("/{attempt_id}/export")
def export_attempt(
    attempt_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> JSONResponse:
    attempt, _ = get_owned_attempt(attempt_id, user)
    attempt = add_legacy_question_options(attempt)
    return JSONResponse(
        content=attempt,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="attempt-{attempt["attemptId"]}.json"'
        },
    )
