from typing import Any

from fastapi import APIRouter, Depends, Request, Response

from app.api.dependencies import get_current_user, validate_request_origin
from app.core.config import (
    AUTH_COOKIE_NAME,
    AUTH_COOKIE_SAMESITE,
    AUTH_COOKIE_SECURE,
)
from app.schemas.auth import LoginRequest
from app.services.auth import login as authenticate

router = APIRouter(prefix="/api/auth")
PUBLIC_USER_FIELDS = ("id", "username", "email", "firstName", "lastName", "image", "gender")


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {key: user[key] for key in PUBLIC_USER_FIELDS if key in user}


@router.post("/login")
async def login(
    request: LoginRequest,
    response: Response,
    http_request: Request,
) -> dict[str, Any]:
    validate_request_origin(http_request)
    login_data = await authenticate(request)
    expires_in_minutes = login_data.get("expiresInMins", 30)
    max_age = (
        expires_in_minutes * 60
        if isinstance(expires_in_minutes, int) and expires_in_minutes > 0
        else 1800
    )
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=login_data["accessToken"],
        max_age=max_age,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
        path="/",
    )
    return public_user(login_data)


@router.get("/me")
async def current_user(
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    return public_user(user)


@router.post("/logout")
async def logout(response: Response, request: Request) -> dict[str, str]:
    validate_request_origin(request)
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
    )
    return {"message": "Logged out"}
