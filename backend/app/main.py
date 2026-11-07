import json
from collections import Counter
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query

DATA_FILE = Path(__file__).resolve().parents[1] / "data" / "questions_en.json"


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


questions = load_questions()
app = FastAPI(title="JaneQ API", version="0.1.0")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/categories")
def get_categories() -> dict[str, list[dict[str, Any]]]:
    counts = Counter(question["type"] for question in questions)
    categories = [
        {"name": name, "question_count": count}
        for name, count in counts.items()
    ]
    return {"categories": categories}


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
