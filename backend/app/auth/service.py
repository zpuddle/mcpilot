from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from passlib.context import CryptContext

from app.database import User, Role
from app.common.exceptions import ConflictException, UnauthorizedException, NotFoundException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


async def authenticate_user(db: AsyncSession, username: str, password: str) -> User:
    result = await db.execute(
        select(User).options(selectinload(User.role)).where(User.username == username)
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        raise UnauthorizedException("Invalid username or password")
    if not user.is_active:
        raise UnauthorizedException("Account is disabled")
    return user


async def create_user(db: AsyncSession, username: str, email: str, password: str, role_name: str = "developer") -> User:
    # Check existing
    result = await db.execute(select(User).where((User.username == username) | (User.email == email)))
    if result.scalar_one_or_none():
        raise ConflictException("Username or email already exists")

    # Get role
    result = await db.execute(select(Role).where(Role.name == role_name))
    role = result.scalar_one_or_none()
    if not role:
        raise NotFoundException(f"Role '{role_name}' not found")

    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        role_id=role.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user, ["role"])
    return user
