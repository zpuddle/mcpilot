from typing import Any, Optional
from pydantic import BaseModel


class ApiResponse(BaseModel):
    success: bool = True
    message: str = "ok"
    data: Optional[Any] = None


class PaginatedResponse(BaseModel):
    success: bool = True
    message: str = "ok"
    data: Optional[Any] = None
    total: int = 0
    page: int = 1
    page_size: int = 20
