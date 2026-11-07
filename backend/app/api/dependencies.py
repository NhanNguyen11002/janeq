from typing import Any

from fastapi import Cookie, Depends, HTTPException, Request, status

from app.core.config import AUTH_COOKIE_NAME, TRUSTED_ORIGINS
from app.services.auth import get_current_user as authenticate_user


class InvalidAuthSession(HTTPException):
    def __init__(self) -> None:
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")


class InvalidRefreshSession(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh session is invalid or expired",
        )


def validate_request_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if origin is not None and origin not in TRUSTED_ORIGINS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Untrusted request origin",
        )


async def get_current_user(
    token: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME),
) -> dict[str, Any]:
    try:
        return await authenticate_user(token)
    except HTTPException as error:
        if error.status_code == status.HTTP_401_UNAUTHORIZED:
            raise InvalidAuthSession() from error
        raise
