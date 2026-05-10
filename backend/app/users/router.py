from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db, User, Role
from app.auth.dependencies import require_admin
from app.users.schemas import (
    RoleCreate, RoleResponse, UserListItem, UserRoleUpdate, UserStatusUpdate
)
from app.common.responses import ApiResponse
from app.common.exceptions import NotFoundException, ConflictException

router = APIRouter(prefix="/users", tags=["users"])
roles_router = APIRouter(prefix="/roles", tags=["roles"])


# ─── Users ───────────────────────────────────────────────────────────────────


@router.get("/", response_model=list[UserListItem])
async def list_users(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    result = await db.execute(select(User).options(selectinload(User.role)))
    users = result.scalars().all()
    return [
        UserListItem(
            id=u.id, username=u.username, email=u.email,
            role_name=u.role.name, is_active=u.is_active
        ) for u in users
    ]


@router.put("/{user_id}/role", response_model=ApiResponse)
async def update_user_role(
    user_id: int, req: UserRoleUpdate,
    db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("User not found")
    user.role_id = req.role_id
    await db.commit()
    return ApiResponse(message="Role updated")


@router.put("/{user_id}/status", response_model=ApiResponse)
async def update_user_status(
    user_id: int, req: UserStatusUpdate,
    db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("User not found")
    user.is_active = req.is_active
    await db.commit()
    return ApiResponse(message="Status updated")


# ─── Roles ───────────────────────────────────────────────────────────────────


@roles_router.get("/", response_model=list[RoleResponse])
async def list_roles(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    result = await db.execute(select(Role))
    return result.scalars().all()


@roles_router.post("/", response_model=RoleResponse)
async def create_role(req: RoleCreate, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    existing = await db.execute(select(Role).where(Role.name == req.name))
    if existing.scalar_one_or_none():
        raise ConflictException("Role already exists")
    role = Role(name=req.name, permissions=req.permissions)
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


@roles_router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int, req: RoleCreate,
    db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)
):
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise NotFoundException("Role not found")
    role.name = req.name
    role.permissions = req.permissions
    await db.commit()
    await db.refresh(role)
    return role
