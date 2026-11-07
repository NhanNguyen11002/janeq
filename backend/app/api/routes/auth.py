from typing import Any

from fastapi import APIRouter

from app.schemas.auth import LoginRequest
from app.services.auth import login as authenticate

router = APIRouter(prefix="/api/auth")


@router.post("/login")
async def login(request: LoginRequest) -> dict[str, Any]:
    return await authenticate(request)
