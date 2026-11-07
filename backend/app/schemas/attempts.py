from pydantic import BaseModel, Field


class AttemptSubmission(BaseModel):
    category: str = Field(min_length=1)
    answers: dict[str, str] = Field(default_factory=dict)
