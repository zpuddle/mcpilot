from typing import Optional, List
from pydantic import BaseModel, EmailStr


class RoleCreate(BaseModel):
    name: str
    permissions: List[str]


class RoleResponse(BaseModel):
    id: int
    name: str
    permissions: list

    class Config:
        from_attributes = True


class UserListItem(BaseModel):
    id: int
    username: str
    email: str
    role_name: str
    is_active: bool
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role_id: int


class UserRoleUpdate(BaseModel):
    role_id: int


class UserStatusUpdate(BaseModel):
    is_active: bool
