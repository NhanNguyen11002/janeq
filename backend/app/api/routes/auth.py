from typing import Any

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status

from app.api.dependencies import (
    InvalidRefreshSession,
    get_current_user,
    validate_request_origin,
)
from app.core.config import (
    AUTH_ACCESS_TOKEN_TTL_MINUTES,
    AUTH_COOKIE_NAME,
    AUTH_COOKIE_SAMESITE,
    AUTH_COOKIE_SECURE,
    AUTH_REFRESH_COOKIE_NAME,
    AUTH_REFRESH_COOKIE_PATH,
    AUTH_REFRESH_TOKEN_TTL_SECONDS,
)
from app.schemas.auth import LoginRequest
from app.services.auth import login as authenticate, refresh_auth_session

router = APIRouter(prefix="/api/auth")
PUBLIC_USER_FIELDS = ("id", "username", "email", "firstName", "lastName", "image", "gender")


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {key: user[key] for key in PUBLIC_USER_FIELDS if key in user}


def set_auth_cookies(response: Response, tokens: dict[str, str]) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=tokens["accessToken"],
        max_age=AUTH_ACCESS_TOKEN_TTL_MINUTES * 60,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
        path="/",
    )
    response.set_cookie(
        key=AUTH_REFRESH_COOKIE_NAME,
        value=tokens["refreshToken"],
        max_age=AUTH_REFRESH_TOKEN_TTL_SECONDS,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
        path=AUTH_REFRESH_COOKIE_PATH,
    )


def delete_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
    )
    response.delete_cookie(
        key=AUTH_REFRESH_COOKIE_NAME,
        path=AUTH_REFRESH_COOKIE_PATH,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
    )


@router.post("/login")
async def login(
    request: LoginRequest,
    response: Response,
    http_request: Request,
) -> dict[str, Any]:
    validate_request_origin(http_request)
    login_data = await authenticate(request)
    set_auth_cookies(response, login_data)
    return public_user(login_data)


@router.get("/me")
async def current_user(
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    return public_user(user)


@router.post("/refresh")
async def refresh(
    response: Response,
    request: Request,
    refresh_token: str | None = Cookie(
        default=None,
        alias=AUTH_REFRESH_COOKIE_NAME,
    ),
) -> dict[str, str]:
    validate_request_origin(request)
    try:
        tokens = await refresh_auth_session(refresh_token)
    except HTTPException as error:
        if error.status_code == status.HTTP_401_UNAUTHORIZED:
            raise InvalidRefreshSession() from error
        raise

    set_auth_cookies(response, tokens)
    return {"message": "Session refreshed"}


@router.post("/logout")
async def logout(response: Response, request: Request) -> dict[str, str]:
    validate_request_origin(request)
    delete_auth_cookies(response)
    return {"message": "Logged out"}
