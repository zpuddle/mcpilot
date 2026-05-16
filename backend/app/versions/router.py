from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import (
    get_db, User, McpService, ServiceCode, ServiceTool, ServiceVersion,
)
from app.auth.dependencies import get_current_user, require_permissions
from app.versions.schemas import VersionCreate, VersionResponse, VersionDetailResponse
from app.common.exceptions import NotFoundException, ForbiddenException
from app.common.responses import ApiResponse

router = APIRouter(prefix="/services/{service_id}/versions", tags=["versions"])


async def _get_service_checked(service_id: int, user: User, db: AsyncSession) -> McpService:
    result = await db.execute(select(McpService).where(McpService.id == service_id))
    svc = result.scalar_one_or_none()
    if not svc:
        raise NotFoundException("Service not found")
    if user.role.name != "admin" and svc.owner_id != user.id:
        raise ForbiddenException("You don't own this service")
    return svc


@router.get("/", response_model=list[VersionResponse], summary="版本列表", description="获取服务的所有版本快照")
async def list_versions(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_service_checked(service_id, user, db)
    result = await db.execute(
        select(ServiceVersion)
        .where(ServiceVersion.service_id == service_id)
        .order_by(ServiceVersion.created_at.desc())
    )
    versions = result.scalars().all()
    return [
        VersionResponse(
            id=v.id, service_id=v.service_id, version_tag=v.version_tag,
            changelog=v.changelog, created_by=v.created_by,
            created_at=v.created_at.isoformat() if v.created_at else "",
        ) for v in versions
    ]


@router.post("/", response_model=VersionResponse, summary="创建版本", description="为服务创建新的版本快照")
async def create_version(
    service_id: int, req: VersionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    svc = await _get_service_checked(service_id, user, db)

    # Get current code
    result = await db.execute(select(ServiceCode).where(ServiceCode.service_id == service_id))
    code_record = result.scalar_one_or_none()
    code_snapshot = code_record.code if code_record else ""

    # Get current tools
    result = await db.execute(select(ServiceTool).where(ServiceTool.service_id == service_id))
    tools = result.scalars().all()
    tools_snapshot = [
        {"name": t.name, "description": t.description, "handler_name": t.handler_name,
         "input_schema": t.input_schema, "output_schema": t.output_schema, "is_enabled": t.is_enabled}
        for t in tools
    ]

    version_tag = f"v{svc.current_version + 1}"
    version = ServiceVersion(
        service_id=service_id,
        version_tag=version_tag,
        code_snapshot=code_snapshot,
        tools_snapshot=tools_snapshot,
        config_snapshot={"env_vars": svc.env_vars, "transport_type": svc.transport_type.value},
        changelog=req.changelog,
        created_by=user.id,
    )
    db.add(version)
    svc.current_version += 1
    await db.commit()
    await db.refresh(version)

    return VersionResponse(
        id=version.id, service_id=version.service_id, version_tag=version.version_tag,
        changelog=version.changelog, created_by=version.created_by,
        created_at=version.created_at.isoformat() if version.created_at else "",
    )


@router.get("/{version_id}", response_model=VersionDetailResponse, summary="版本详情", description="获取指定版本的详细信息，包含代码和配置快照")
async def get_version_detail(
    service_id: int, version_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_service_checked(service_id, user, db)
    result = await db.execute(
        select(ServiceVersion).where(ServiceVersion.id == version_id, ServiceVersion.service_id == service_id)
    )
    version = result.scalar_one_or_none()
    if not version:
        raise NotFoundException("Version not found")
    return VersionDetailResponse(
        id=version.id, service_id=version.service_id, version_tag=version.version_tag,
        changelog=version.changelog, created_by=version.created_by,
        created_at=version.created_at.isoformat() if version.created_at else "",
        code_snapshot=version.code_snapshot,
        tools_snapshot=version.tools_snapshot or [],
        config_snapshot=version.config_snapshot or {},
    )


@router.post("/{version_id}/rollback", response_model=ApiResponse, summary="版本回滚", description="将服务代码和配置回滚到指定版本")
async def rollback_to_version(
    service_id: int, version_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:deploy"])),
):
    svc = await _get_service_checked(service_id, user, db)

    result = await db.execute(
        select(ServiceVersion).where(ServiceVersion.id == version_id, ServiceVersion.service_id == service_id)
    )
    version = result.scalar_one_or_none()
    if not version:
        raise NotFoundException("Version not found")

    # Restore code
    result = await db.execute(select(ServiceCode).where(ServiceCode.service_id == service_id))
    code_record = result.scalar_one_or_none()
    if code_record:
        code_record.code = version.code_snapshot
    else:
        code_record = ServiceCode(service_id=service_id, code=version.code_snapshot)
        db.add(code_record)

    # Restore config
    if version.config_snapshot:
        if "env_vars" in version.config_snapshot:
            svc.env_vars = version.config_snapshot["env_vars"]

    await db.commit()
    return ApiResponse(message=f"Rolled back to {version.version_tag}. Redeploy to apply changes.")
