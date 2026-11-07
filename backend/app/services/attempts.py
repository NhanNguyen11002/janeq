import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from app.repositories.attempts import save_attempt
from app.schemas.attempts import AttemptSubmission


def create_attempt(
    submission: AttemptSubmission,
    user: dict[str, Any],
    questions: list[dict[str, Any]],
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
    save_attempt(attempt)
    return attempt
