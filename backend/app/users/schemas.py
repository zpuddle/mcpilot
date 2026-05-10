from typing import Optional, List
from pydantic import BaseModel


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

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    role_id: int


class UserStatusUpdate(BaseModel):
    is_active: bool
