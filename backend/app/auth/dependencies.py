from typing import List
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db, User
from app.auth.jwt import decode_token
from app.common.exceptions import UnauthorizedException, ForbiddenException

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise UnauthorizedException("Invalid or expired token")

    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException("Invalid token payload")

    result = await db.execute(
        select(User).options(selectinload(User.role)).where(User.id == int(user_id))
    )
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise UnauthorizedException("User not found or inactive")

    return user


def require_permissions(required: List[str]):
    async def permission_checker(user: User = Depends(get_current_user)):
        user_perms = user.role.permissions or []
        if "*" in user_perms:
            return user
        for perm in required:
            if perm not in user_perms:
                raise ForbiddenException(f"Missing permission: {perm}")
        return user
    return permission_checker


def require_admin(user: User = Depends(get_current_user)):
    if user.role.name != "admin":
        raise ForbiddenException("Admin access required")
    return user
