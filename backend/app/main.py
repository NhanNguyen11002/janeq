from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.api.dependencies import InvalidAuthSession
from app.api.routes.attempts import router as attempts_router
from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.questions import router as questions_router
from app.core.config import AUTH_COOKIE_NAME, AUTH_COOKIE_SAMESITE, AUTH_COOKIE_SECURE

app = FastAPI(title="JaneQ API", version="0.2.0")


@app.exception_handler(InvalidAuthSession)
async def clear_invalid_auth_cookie(_, error: InvalidAuthSession) -> JSONResponse:
    response = JSONResponse(
        status_code=error.status_code,
        content={"detail": error.detail},
    )
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
    )
    return response


app.include_router(health_router)
app.include_router(auth_router)
app.include_router(questions_router)
app.include_router(attempts_router)
