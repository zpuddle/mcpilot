from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db, User, Role
from app.auth.dependencies import require_admin
from app.auth.service import hash_password
from app.users.schemas import (
    RoleCreate, RoleResponse, UserListItem, UserRoleUpdate, UserStatusUpdate, UserCreate
)
from app.common.responses import ApiResponse
from app.common.exceptions import NotFoundException, ConflictException, AppException

router = APIRouter(prefix="/users", tags=["admin"])
roles_router = APIRouter(prefix="/roles", tags=["admin"])


# ─── Users ───────────────────────────────────────────────────────────────────


@router.get("/", response_model=list[UserListItem], summary="用户列表", description="获取所有用户列表（管理员）")
async def list_users(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    result = await db.execute(select(User).options(selectinload(User.role)))
    users = result.scalars().all()
    return [
        UserListItem(
            id=u.id, username=u.username, email=u.email,
            role_name=u.role.name, is_active=u.is_active,
            created_at=u.created_at.isoformat() if u.created_at else None,
        ) for u in users
    ]


@router.post("/", response_model=ApiResponse, summary="创建用户", description="管理员创建新用户")
async def create_user(
    req: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    # 检查用户名唯一性
    existing = await db.execute(select(User).where(User.username == req.username))
    if existing.scalar_one_or_none():
        raise ConflictException(f"Username '{req.username}' already exists")

    # 检查邮箱唯一性
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise ConflictException(f"Email '{req.email}' already exists")

    # 检查角色存在
    role_result = await db.execute(select(Role).where(Role.id == req.role_id))
    if not role_result.scalar_one_or_none():
        raise NotFoundException("Role not found")

    user = User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
        role_id=req.role_id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return ApiResponse(message="User created", data={"id": user.id, "username": user.username})


@router.put("/{user_id}/role", response_model=ApiResponse, summary="修改用户角色", description="更新指定用户的角色")
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


@router.put("/{user_id}/status", response_model=ApiResponse, summary="修改用户状态", description="启用或禁用指定用户")
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


@router.delete("/{user_id}", response_model=ApiResponse, summary="删除用户", description="管理员删除用户")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    # 不允许删除自己
    if user_id == admin.id:
        raise AppException("Cannot delete yourself", status_code=400)

    result = await db.execute(select(User).options(selectinload(User.role)).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("User not found")

    # 不允许删除唯一的 admin
    if user.role.name == "admin":
        admin_count_result = await db.execute(
            select(func.count(User.id)).join(Role).where(Role.name == "admin")
        )
        admin_count = admin_count_result.scalar() or 0
        if admin_count <= 1:
            raise AppException("Cannot delete the last admin user", status_code=400)

    await db.delete(user)
    await db.commit()
    return ApiResponse(message="User deleted")


# ─── Roles ───────────────────────────────────────────────────────────────────


@roles_router.get("/", response_model=list[RoleResponse], summary="角色列表", description="获取所有角色列表")
async def list_roles(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    result = await db.execute(select(Role))
    return result.scalars().all()


@roles_router.post("/", response_model=RoleResponse, summary="创建角色", description="创建新的角色并设置权限")
async def create_role(req: RoleCreate, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    existing = await db.execute(select(Role).where(Role.name == req.name))
    if existing.scalar_one_or_none():
        raise ConflictException("Role already exists")
    role = Role(name=req.name, permissions=req.permissions)
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


@roles_router.put("/{role_id}", response_model=RoleResponse, summary="更新角色", description="更新角色名称和权限配置")
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
