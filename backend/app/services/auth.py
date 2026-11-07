from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import DUMMYJSON_URL
from app.schemas.auth import LoginRequest


async def get_current_user(token: str | None) -> dict[str, Any]:
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login required",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{DUMMYJSON_URL}/auth/me",
                headers={"Authorization": f"Bearer {token}"},
            )
    except httpx.RequestError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service is unavailable",
        ) from error

    if response.status_code in (401, 403):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    if not response.is_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service returned an error",
        )
    try:
        user = response.json()
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service returned invalid data",
        ) from error

    if not isinstance(user, dict) or not isinstance(user.get("id"), int):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service returned an invalid user",
        )
    return user


async def login(request: LoginRequest) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{DUMMYJSON_URL}/auth/login",
                json={"username": request.username, "password": request.password},
            )
    except httpx.RequestError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service is unavailable",
        ) from error

    if response.status_code in (400, 401, 403, 404):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not response.is_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service returned an error",
        )
    try:
        login_data = response.json()
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service returned invalid data",
        ) from error

    if (
        not isinstance(login_data, dict)
        or not isinstance(login_data.get("id"), int)
        or not isinstance(login_data.get("accessToken"), str)
    ):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service returned an invalid login response",
        )
    return login_data
