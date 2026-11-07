from fastapi import FastAPI

from app.api.routes.attempts import router as attempts_router
from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.questions import router as questions_router

app = FastAPI(title="JaneQ API", version="0.2.0")
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(questions_router)
app.include_router(attempts_router)
