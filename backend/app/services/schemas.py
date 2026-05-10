import re
from typing import Optional, List
from pydantic import BaseModel, field_validator

from app.database.models import ServiceStatus, TransportType


class ServiceCreate(BaseModel):
    name: str
    description: str = ""
    transport_type: TransportType = TransportType.sse

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        if len(v) < 2 or len(v) > 100:
            raise ValueError("Name must be 2-100 characters")
        return v


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    transport_type: Optional[TransportType] = None
    env_vars: Optional[dict] = None
    extra_dependencies: Optional[str] = None


class ServiceResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    owner_id: int
    owner_name: str = ""
    status: ServiceStatus
    transport_type: TransportType
    port: Optional[int]
    container_id: Optional[str]
    image_tag: Optional[str]
    current_version: int
    env_vars: dict
    extra_dependencies: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class ServiceListItem(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    status: ServiceStatus
    transport_type: TransportType
    port: Optional[int]
    current_version: int
    owner_name: str = ""
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class ServiceCodeRequest(BaseModel):
    code: str


class ServiceCodeResponse(BaseModel):
    code: str
    updated_at: Optional[str] = None


class CodeValidationResponse(BaseModel):
    valid: bool
    errors: List[str] = []
    warnings: List[str] = []


def name_to_slug(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9\u4e00-\u9fff]+', '-', slug)
    slug = slug.strip('-')
    return slug
