from collections import Counter
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.repositories.questions import questions

router = APIRouter(prefix="/api")


@router.get("/categories")
def get_categories() -> dict[str, list[dict[str, Any]]]:
    counts = Counter(question["type"] for question in questions)
    return {
        "categories": [
            {"name": name, "questionCount": count}
            for name, count in counts.items()
        ]
    }


@router.get("/questions")
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
