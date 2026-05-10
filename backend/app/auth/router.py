from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, User
from app.auth.schemas import (
    LoginRequest, RegisterRequest, TokenResponse, RefreshRequest, UserResponse, UserUpdateRequest
)
from app.auth.service import authenticate_user, create_user, hash_password
from app.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.auth.dependencies import get_current_user
from app.common.exceptions import UnauthorizedException
from app.common.responses import ApiResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, req.username, req.password)
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/register", response_model=ApiResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await create_user(db, req.username, req.email, req.password)
    return ApiResponse(message="User registered successfully", data={"id": user.id, "username": user.username})


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise UnauthorizedException("Invalid refresh token")
    user_id = payload.get("sub")
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role_name=user.role.name,
        permissions=user.role.permissions or [],
        is_active=user.is_active,
    )


@router.put("/me", response_model=ApiResponse)
async def update_me(req: UserUpdateRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if req.email:
        user.email = req.email
    if req.password:
        user.hashed_password = hash_password(req.password)
    await db.commit()
    return ApiResponse(message="Profile updated")
