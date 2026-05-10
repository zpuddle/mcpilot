from typing import Optional
from pydantic import BaseModel


class ToolCreate(BaseModel):
    name: str
    description: str = ""
    handler_name: str
    input_schema: dict = {}
    output_schema: dict = {}
    is_enabled: bool = True


class ToolUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    handler_name: Optional[str] = None
    input_schema: Optional[dict] = None
    output_schema: Optional[dict] = None
    is_enabled: Optional[bool] = None


class ToolResponse(BaseModel):
    id: int
    service_id: int
    name: str
    description: str
    handler_name: str
    input_schema: dict
    output_schema: dict
    is_enabled: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class ResourceCreate(BaseModel):
    uri_template: str
    name: str
    description: str = ""
    mime_type: str = "text/plain"
    handler_name: str
    is_enabled: bool = True


class ResourceUpdate(BaseModel):
    uri_template: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    mime_type: Optional[str] = None
    handler_name: Optional[str] = None
    is_enabled: Optional[bool] = None


class ResourceResponse(BaseModel):
    id: int
    service_id: int
    uri_template: str
    name: str
    description: str
    mime_type: str
    handler_name: str
    is_enabled: bool
    created_at: str

    class Config:
        from_attributes = True
