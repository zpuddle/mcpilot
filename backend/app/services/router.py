from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db, User, McpService, ServiceCode, ServiceStatus
from app.database.models import DeployLog
from app.auth.dependencies import get_current_user, require_permissions
from app.services.schemas import (
    ServiceCreate, ServiceUpdate, ServiceResponse, ServiceListItem,
    ServiceCodeRequest, ServiceCodeResponse, CodeValidationResponse, name_to_slug
)
from app.services.code_validator import validate_code
from app.common.exceptions import NotFoundException, ConflictException, ForbiddenException
from app.common.responses import ApiResponse, PaginatedResponse

router = APIRouter(prefix="/services", tags=["services"])


def _can_view_all_services(user: User) -> bool:
    return user.role.name == "admin" or "*" in (user.role.permissions or [])


def _scope_services_for_user(query, user: User):
    if _can_view_all_services(user):
        return query
    return query.where(McpService.owner_id == user.id)


def _empty_status_counts() -> dict[str, int]:
    return {status.value: 0 for status in ServiceStatus}


async def _get_dashboard_stats(db: AsyncSession, user: User) -> dict:
    query = select(
        func.count(McpService.id).label("total"),
        func.sum(case((McpService.status == ServiceStatus.draft, 1), else_=0)).label("draft"),
        func.sum(case((McpService.status == ServiceStatus.running, 1), else_=0)).label("running"),
        func.sum(case((McpService.status == ServiceStatus.stopped, 1), else_=0)).label("stopped"),
        func.sum(case((McpService.status == ServiceStatus.error, 1), else_=0)).label("errors"),
        func.sum(case((McpService.status == ServiceStatus.building, 1), else_=0)).label("building"),
    )
    query = _scope_services_for_user(query, user)

    result = await db.execute(query)
    row = result.one()
    errors = int(row.errors or 0)

    return {
        "total": row.total or 0,
        "draft": int(row.draft or 0),
        "running": int(row.running or 0),
        "stopped": int(row.stopped or 0),
        "errors": errors,
        "error": errors,
        "building": int(row.building or 0),
    }


async def _get_status_counts(db: AsyncSession, user: User) -> dict[str, int]:
    query = select(McpService.status, func.count(McpService.id)).group_by(McpService.status)
    query = _scope_services_for_user(query, user)

    result = await db.execute(query)
    counts = _empty_status_counts()
    for status, count in result.all():
        counts[status.value] = count or 0
    return counts


async def _get_recent_services(db: AsyncSession, user: User, limit: int = 5) -> list[dict]:
    query = select(McpService).order_by(McpService.updated_at.desc()).limit(limit)
    query = _scope_services_for_user(query, user)

    result = await db.execute(query)
    services = result.scalars().all()

    return [
        {
            "id": svc.id,
            "name": svc.name,
            "status": svc.status.value,
            "updatedAt": svc.updated_at.isoformat() if svc.updated_at else "",
            "transport_type": svc.transport_type.value,
            "port": svc.port,
            "current_version": svc.current_version,
        }
        for svc in services
    ]


async def _get_recent_activities(db: AsyncSession, user: User, limit: int = 10) -> list[dict]:
    query = (
        select(DeployLog)
        .options(selectinload(DeployLog.service))
        .join(McpService, DeployLog.service_id == McpService.id)
        .order_by(DeployLog.created_at.desc())
        .limit(limit)
    )
    if not _can_view_all_services(user):
        query = query.where(McpService.owner_id == user.id)

    result = await db.execute(query)
    logs = result.scalars().all()

    user_ids = {log.triggered_by for log in logs if log.triggered_by}
    usernames: dict[int, str] = {}
    if user_ids:
        users_result = await db.execute(select(User.id, User.username).where(User.id.in_(user_ids)))
        usernames = {user_id: username for user_id, username in users_result.all()}

    return [
        {
            "id": log.id,
            "type": log.action.value,
            "service": log.service.name if log.service else "Unknown",
            "user": usernames.get(log.triggered_by, "system"),
            "status": log.status.value,
            "time": log.created_at.isoformat() if log.created_at else "",
        }
        for log in logs
    ]


@router.get("/dashboard/stats")
async def dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取仪表板统计数据"""
    return await _get_dashboard_stats(db, current_user)


@router.get("/dashboard/overview", summary="仪表盘概览", description="获取首页所需的统计、健康度、最近服务和最近活动")
async def dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stats = await _get_dashboard_stats(db, current_user)
    status_counts = await _get_status_counts(db, current_user)
    recent_services = await _get_recent_services(db, current_user)
    recent_activities = await _get_recent_activities(db, current_user)

    total = stats["total"]
    attention = stats["errors"] + stats["building"]
    running_rate = round((stats["running"] / total) * 100) if total else 0

    return {
        "stats": stats,
        "health": {
            "running_rate": running_rate,
            "attention_count": attention,
            "ready_count": stats["running"] + stats["stopped"],
        },
        "status_breakdown": [
            {"status": status.value, "count": status_counts[status.value]}
            for status in ServiceStatus
        ],
        "recent_services": recent_services,
        "recent_activities": recent_activities,
    }


@router.get("/dashboard/recent-activities", summary="最近活动", description="获取仪表盘最近操作活动")
async def dashboard_recent_activities(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """从 deploy_logs 获取最近活动"""
    return await _get_recent_activities(db, current_user)


@router.get("/dashboard/recent-services", summary="最近更新服务", description="获取最近更新的服务列表")
async def dashboard_recent_services(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """按 updated_at 降序获取最近更新的服务"""
    return await _get_recent_services(db, current_user)


def _service_to_response(svc: McpService) -> ServiceResponse:
    return ServiceResponse(
        id=svc.id,
        name=svc.name,
        slug=svc.slug,
        description=svc.description,
        owner_id=svc.owner_id,
        owner_name=svc.owner.username if svc.owner else "",
        status=svc.status,
        transport_type=svc.transport_type,
        port=svc.port,
        container_id=svc.container_id,
        image_tag=svc.image_tag,
        current_version=svc.current_version,
        env_vars=svc.env_vars or {},
        extra_dependencies=svc.extra_dependencies or "",
        created_at=svc.created_at.isoformat() if svc.created_at else "",
        updated_at=svc.updated_at.isoformat() if svc.updated_at else "",
    )


def _check_ownership(svc: McpService, user: User):
    if user.role.name == "admin":
        return
    if svc.owner_id != user.id:
        raise ForbiddenException("You don't own this service")


@router.get("/", response_model=PaginatedResponse, summary="服务列表", description="获取 MCP 服务列表，支持分页和状态过滤")
async def list_services(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[ServiceStatus] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(McpService).options(selectinload(McpService.owner))

    # Non-admin only sees own services
    if user.role.name != "admin":
        query = query.where(McpService.owner_id == user.id)

    if status:
        query = query.where(McpService.status == status)

    # Count total
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Paginate
    query = query.order_by(McpService.updated_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    services = result.scalars().all()

    items = [
        ServiceListItem(
            id=s.id, name=s.name, slug=s.slug, description=s.description,
            status=s.status, transport_type=s.transport_type, port=s.port,
            current_version=s.current_version,
            owner_name=s.owner.username if s.owner else "",
            created_at=s.created_at.isoformat() if s.created_at else "",
            updated_at=s.updated_at.isoformat() if s.updated_at else "",
        ) for s in services
    ]

    return PaginatedResponse(data=items, total=total, page=page, page_size=page_size)


@router.post("/", response_model=ServiceResponse, summary="创建服务", description="创建新的 MCP 服务配置")
async def create_service(
    req: ServiceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    slug = name_to_slug(req.name)

    # Ensure unique slug
    existing = await db.execute(select(McpService).where(McpService.slug == slug))
    if existing.scalar_one_or_none():
        raise ConflictException(f"Service with slug '{slug}' already exists")

    svc = McpService(
        name=req.name,
        slug=slug,
        description=req.description,
        owner_id=user.id,
        transport_type=req.transport_type,
        status=ServiceStatus.draft,
    )
    db.add(svc)
    await db.flush()

    # Create empty code record
    code = ServiceCode(service_id=svc.id, code="")
    db.add(code)

    await db.commit()
    await db.refresh(svc, ["owner"])
    return _service_to_response(svc)


@router.get("/{service_id}", response_model=ServiceResponse, summary="服务详情", description="获取指定服务的详细信息")
async def get_service(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(McpService).options(selectinload(McpService.owner)).where(McpService.id == service_id)
    )
    svc = result.scalar_one_or_none()
    if not svc:
        raise NotFoundException("Service not found")
    _check_ownership(svc, user)
    return _service_to_response(svc)


@router.put("/{service_id}", response_model=ServiceResponse, summary="更新服务", description="更新服务的基本配置")
async def update_service(
    service_id: int, req: ServiceUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    result = await db.execute(
        select(McpService).options(selectinload(McpService.owner)).where(McpService.id == service_id)
    )
    svc = result.scalar_one_or_none()
    if not svc:
        raise NotFoundException("Service not found")
    _check_ownership(svc, user)

    if req.name is not None:
        svc.name = req.name
    if req.description is not None:
        svc.description = req.description
    if req.transport_type is not None:
        svc.transport_type = req.transport_type
    if req.env_vars is not None:
        svc.env_vars = req.env_vars
    if req.extra_dependencies is not None:
        svc.extra_dependencies = req.extra_dependencies

    await db.commit()
    await db.refresh(svc, ["owner"])
    return _service_to_response(svc)


@router.delete("/{service_id}", response_model=ApiResponse, summary="删除服务", description="删除服务及其所有关联数据")
async def delete_service(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    result = await db.execute(select(McpService).where(McpService.id == service_id))
    svc = result.scalar_one_or_none()
    if not svc:
        raise NotFoundException("Service not found")
    _check_ownership(svc, user)

    await db.delete(svc)
    await db.commit()
    return ApiResponse(message="Service deleted")


# ─── Code Management ─────────────────────────────────────────────────────────


@router.get("/{service_id}/code", response_model=ServiceCodeResponse, summary="获取代码", description="获取服务的 Python handler 代码")
async def get_code(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(McpService).where(McpService.id == service_id))
    svc = result.scalar_one_or_none()
    if not svc:
        raise NotFoundException("Service not found")
    _check_ownership(svc, user)

    result = await db.execute(select(ServiceCode).where(ServiceCode.service_id == service_id))
    code_record = result.scalar_one_or_none()
    if not code_record:
        return ServiceCodeResponse(code="")

    return ServiceCodeResponse(
        code=code_record.code,
        updated_at=code_record.updated_at.isoformat() if code_record.updated_at else None,
    )


@router.put("/{service_id}/code", response_model=ApiResponse, summary="保存代码", description="保存或更新服务的 handler 代码")
async def save_code(
    service_id: int, req: ServiceCodeRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    result = await db.execute(select(McpService).where(McpService.id == service_id))
    svc = result.scalar_one_or_none()
    if not svc:
        raise NotFoundException("Service not found")
    _check_ownership(svc, user)

    result = await db.execute(select(ServiceCode).where(ServiceCode.service_id == service_id))
    code_record = result.scalar_one_or_none()
    if code_record:
        code_record.code = req.code
    else:
        code_record = ServiceCode(service_id=service_id, code=req.code)
        db.add(code_record)

    await db.commit()
    return ApiResponse(message="Code saved")


@router.post("/{service_id}/code/validate", response_model=CodeValidationResponse, summary="验证代码", description="对代码进行语法检查和安全扫描")
async def validate_service_code(
    service_id: int, req: ServiceCodeRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    valid, errors, warnings = validate_code(req.code)
    return CodeValidationResponse(valid=valid, errors=errors, warnings=warnings)
