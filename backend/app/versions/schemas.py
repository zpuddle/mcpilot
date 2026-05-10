from typing import Optional
from pydantic import BaseModel


class VersionCreate(BaseModel):
    changelog: str = ""


class VersionResponse(BaseModel):
    id: int
    service_id: int
    version_tag: str
    changelog: str
    created_by: Optional[int]
    created_at: str

    class Config:
        from_attributes = True


class VersionDetailResponse(VersionResponse):
    code_snapshot: str
    tools_snapshot: list
    config_snapshot: dict
