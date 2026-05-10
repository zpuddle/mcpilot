from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, User, McpService, ServiceTool, ServiceResource
from app.auth.dependencies import get_current_user, require_permissions
from app.tools.schemas import (
    ToolCreate, ToolUpdate, ToolResponse,
    ResourceCreate, ResourceUpdate, ResourceResponse,
)
from app.common.exceptions import NotFoundException, ForbiddenException
from app.common.responses import ApiResponse

router = APIRouter(prefix="/services/{service_id}", tags=["tools"])


async def _get_service_checked(service_id: int, user: User, db: AsyncSession) -> McpService:
    result = await db.execute(select(McpService).where(McpService.id == service_id))
    svc = result.scalar_one_or_none()
    if not svc:
        raise NotFoundException("Service not found")
    if user.role.name != "admin" and svc.owner_id != user.id:
        raise ForbiddenException("You don't own this service")
    return svc


# ─── Tools ───────────────────────────────────────────────────────────────────


@router.get("/tools", response_model=list[ToolResponse])
async def list_tools(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_service_checked(service_id, user, db)
    result = await db.execute(
        select(ServiceTool).where(ServiceTool.service_id == service_id).order_by(ServiceTool.id)
    )
    tools = result.scalars().all()
    return [
        ToolResponse(
            id=t.id, service_id=t.service_id, name=t.name, description=t.description,
            handler_name=t.handler_name, input_schema=t.input_schema or {},
            output_schema=t.output_schema or {}, is_enabled=t.is_enabled,
            created_at=t.created_at.isoformat() if t.created_at else "",
            updated_at=t.updated_at.isoformat() if t.updated_at else "",
        ) for t in tools
    ]


@router.post("/tools", response_model=ToolResponse)
async def create_tool(
    service_id: int, req: ToolCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    await _get_service_checked(service_id, user, db)
    tool = ServiceTool(
        service_id=service_id,
        name=req.name,
        description=req.description,
        handler_name=req.handler_name,
        input_schema=req.input_schema,
        output_schema=req.output_schema,
        is_enabled=req.is_enabled,
    )
    db.add(tool)
    await db.commit()
    await db.refresh(tool)
    return ToolResponse(
        id=tool.id, service_id=tool.service_id, name=tool.name,
        description=tool.description, handler_name=tool.handler_name,
        input_schema=tool.input_schema or {}, output_schema=tool.output_schema or {},
        is_enabled=tool.is_enabled,
        created_at=tool.created_at.isoformat() if tool.created_at else "",
        updated_at=tool.updated_at.isoformat() if tool.updated_at else "",
    )


@router.put("/tools/{tool_id}", response_model=ToolResponse)
async def update_tool(
    service_id: int, tool_id: int, req: ToolUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    await _get_service_checked(service_id, user, db)
    result = await db.execute(
        select(ServiceTool).where(ServiceTool.id == tool_id, ServiceTool.service_id == service_id)
    )
    tool = result.scalar_one_or_none()
    if not tool:
        raise NotFoundException("Tool not found")

    if req.name is not None:
        tool.name = req.name
    if req.description is not None:
        tool.description = req.description
    if req.handler_name is not None:
        tool.handler_name = req.handler_name
    if req.input_schema is not None:
        tool.input_schema = req.input_schema
    if req.output_schema is not None:
        tool.output_schema = req.output_schema
    if req.is_enabled is not None:
        tool.is_enabled = req.is_enabled

    await db.commit()
    await db.refresh(tool)
    return ToolResponse(
        id=tool.id, service_id=tool.service_id, name=tool.name,
        description=tool.description, handler_name=tool.handler_name,
        input_schema=tool.input_schema or {}, output_schema=tool.output_schema or {},
        is_enabled=tool.is_enabled,
        created_at=tool.created_at.isoformat() if tool.created_at else "",
        updated_at=tool.updated_at.isoformat() if tool.updated_at else "",
    )


@router.delete("/tools/{tool_id}", response_model=ApiResponse)
async def delete_tool(
    service_id: int, tool_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    await _get_service_checked(service_id, user, db)
    result = await db.execute(
        select(ServiceTool).where(ServiceTool.id == tool_id, ServiceTool.service_id == service_id)
    )
    tool = result.scalar_one_or_none()
    if not tool:
        raise NotFoundException("Tool not found")
    await db.delete(tool)
    await db.commit()
    return ApiResponse(message="Tool deleted")


# ─── Resources ───────────────────────────────────────────────────────────────


@router.get("/resources", response_model=list[ResourceResponse])
async def list_resources(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_service_checked(service_id, user, db)
    result = await db.execute(
        select(ServiceResource).where(ServiceResource.service_id == service_id).order_by(ServiceResource.id)
    )
    resources = result.scalars().all()
    return [
        ResourceResponse(
            id=r.id, service_id=r.service_id, uri_template=r.uri_template,
            name=r.name, description=r.description, mime_type=r.mime_type,
            handler_name=r.handler_name, is_enabled=r.is_enabled,
            created_at=r.created_at.isoformat() if r.created_at else "",
        ) for r in resources
    ]


@router.post("/resources", response_model=ResourceResponse)
async def create_resource(
    service_id: int, req: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    await _get_service_checked(service_id, user, db)
    resource = ServiceResource(
        service_id=service_id,
        uri_template=req.uri_template,
        name=req.name,
        description=req.description,
        mime_type=req.mime_type,
        handler_name=req.handler_name,
        is_enabled=req.is_enabled,
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return ResourceResponse(
        id=resource.id, service_id=resource.service_id, uri_template=resource.uri_template,
        name=resource.name, description=resource.description, mime_type=resource.mime_type,
        handler_name=resource.handler_name, is_enabled=resource.is_enabled,
        created_at=resource.created_at.isoformat() if resource.created_at else "",
    )


@router.put("/resources/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    service_id: int, resource_id: int, req: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    await _get_service_checked(service_id, user, db)
    result = await db.execute(
        select(ServiceResource).where(ServiceResource.id == resource_id, ServiceResource.service_id == service_id)
    )
    resource = result.scalar_one_or_none()
    if not resource:
        raise NotFoundException("Resource not found")

    if req.uri_template is not None:
        resource.uri_template = req.uri_template
    if req.name is not None:
        resource.name = req.name
    if req.description is not None:
        resource.description = req.description
    if req.mime_type is not None:
        resource.mime_type = req.mime_type
    if req.handler_name is not None:
        resource.handler_name = req.handler_name
    if req.is_enabled is not None:
        resource.is_enabled = req.is_enabled

    await db.commit()
    await db.refresh(resource)
    return ResourceResponse(
        id=resource.id, service_id=resource.service_id, uri_template=resource.uri_template,
        name=resource.name, description=resource.description, mime_type=resource.mime_type,
        handler_name=resource.handler_name, is_enabled=resource.is_enabled,
        created_at=resource.created_at.isoformat() if resource.created_at else "",
    )


@router.delete("/resources/{resource_id}", response_model=ApiResponse)
async def delete_resource(
    service_id: int, resource_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    await _get_service_checked(service_id, user, db)
    result = await db.execute(
        select(ServiceResource).where(ServiceResource.id == resource_id, ServiceResource.service_id == service_id)
    )
    resource = result.scalar_one_or_none()
    if not resource:
        raise NotFoundException("Resource not found")
    await db.delete(resource)
    await db.commit()
    return ApiResponse(message="Resource deleted")
