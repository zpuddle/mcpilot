import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, User, McpService, ServiceStatus
from app.database.models import AlertRule, AlertHistory
from app.auth.dependencies import get_current_user, require_permissions
from app.common.exceptions import NotFoundException, AppException
from app.common.responses import ApiResponse
from app.monitoring.metrics import get_container_metrics

logger = logging.getLogger(__name__)
router = APIRouter(tags=["monitoring"])


# ─── Schemas ────────────────────────────────────────────────────────────────


class AlertRuleCreate(BaseModel):
    name: str = Field(..., max_length=200)
    service_id: Optional[int] = None
    condition_type: str = Field(..., pattern="^(container_down|memory_high|cpu_high|restart_count)$")
    threshold: Optional[str] = None
    is_enabled: bool = True
    notify_method: str = Field(default="log", pattern="^(log|webhook)$")
    webhook_url: Optional[str] = None


class AlertRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    service_id: Optional[int] = None
    condition_type: Optional[str] = Field(None, pattern="^(container_down|memory_high|cpu_high|restart_count)$")
    threshold: Optional[str] = None
    is_enabled: Optional[bool] = None
    notify_method: Optional[str] = Field(None, pattern="^(log|webhook)$")
    webhook_url: Optional[str] = None


# ─── Metrics Endpoint ───────────────────────────────────────────────────────


@router.get("/services/{service_id}/metrics", summary="获取服务实时指标")
async def get_service_metrics(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取服务容器的实时 CPU、内存、重启次数等指标"""
    result = await db.execute(select(McpService).where(McpService.id == service_id))
    svc = result.scalar_one_or_none()
    if not svc:
        raise NotFoundException("Service not found")

    # 权限检查：admin 或服务所有者
    if user.role.name != "admin" and svc.owner_id != user.id:
        from app.common.exceptions import ForbiddenException
        raise ForbiddenException("You don't own this service")

    if not svc.container_id:
        return {"service_id": service_id, "metrics": None, "message": "No container running"}

    metrics = await get_container_metrics(svc.container_id)
    return {"service_id": service_id, "service_name": svc.name, "metrics": metrics}


# ─── Alert Rules CRUD ───────────────────────────────────────────────────────


@router.get("/alert-rules", summary="告警规则列表")
async def list_alert_rules(
    service_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取告警规则列表，可按 service_id 过滤"""
    query = select(AlertRule)
    if service_id is not None:
        query = query.where(AlertRule.service_id == service_id)
    query = query.order_by(desc(AlertRule.created_at))

    result = await db.execute(query)
    rules = result.scalars().all()

    return {
        "rules": [
            {
                "id": r.id,
                "name": r.name,
                "service_id": r.service_id,
                "condition_type": r.condition_type,
                "threshold": r.threshold,
                "is_enabled": r.is_enabled,
                "notify_method": r.notify_method,
                "webhook_url": r.webhook_url,
                "created_by": r.created_by,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rules
        ],
        "total": len(rules),
    }


@router.post("/alert-rules", response_model=ApiResponse, summary="创建告警规则")
async def create_alert_rule(
    body: AlertRuleCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    """创建新的告警规则"""
    # 如果指定了 service_id，检查服务是否存在
    if body.service_id:
        result = await db.execute(select(McpService).where(McpService.id == body.service_id))
        if not result.scalar_one_or_none():
            raise NotFoundException("Service not found")

    rule = AlertRule(
        name=body.name,
        service_id=body.service_id,
        condition_type=body.condition_type,
        threshold=body.threshold,
        is_enabled=body.is_enabled,
        notify_method=body.notify_method,
        webhook_url=body.webhook_url,
        created_by=user.id,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)

    return ApiResponse(message="Alert rule created", data={"id": rule.id})


@router.put("/alert-rules/{rule_id}", response_model=ApiResponse, summary="更新告警规则")
async def update_alert_rule(
    rule_id: int,
    body: AlertRuleUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    """更新告警规则"""
    result = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise NotFoundException("Alert rule not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rule, key, value)

    await db.commit()
    return ApiResponse(message="Alert rule updated")


@router.delete("/alert-rules/{rule_id}", response_model=ApiResponse, summary="删除告警规则")
async def delete_alert_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    """删除告警规则"""
    result = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise NotFoundException("Alert rule not found")

    await db.delete(rule)
    await db.commit()
    return ApiResponse(message="Alert rule deleted")


# ─── Alert History ──────────────────────────────────────────────────────────


@router.get("/alerts", summary="告警历史")
async def list_alerts(
    service_id: Optional[int] = None,
    resolved: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取告警历史记录，支持分页和过滤"""
    query = select(AlertHistory)
    if service_id is not None:
        query = query.where(AlertHistory.service_id == service_id)
    if resolved is not None:
        query = query.where(AlertHistory.resolved == resolved)

    query = query.order_by(desc(AlertHistory.created_at))

    # Count total
    from sqlalchemy import func
    count_query = select(func.count()).select_from(AlertHistory)
    if service_id is not None:
        count_query = count_query.where(AlertHistory.service_id == service_id)
    if resolved is not None:
        count_query = count_query.where(AlertHistory.resolved == resolved)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Paginate
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    alerts = result.scalars().all()

    return {
        "alerts": [
            {
                "id": a.id,
                "rule_id": a.rule_id,
                "service_id": a.service_id,
                "service_name": a.service_name,
                "alert_type": a.alert_type,
                "message": a.message,
                "resolved": a.resolved,
                "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in alerts
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/alerts/{alert_id}/resolve", response_model=ApiResponse, summary="标记告警已解决")
async def resolve_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    """标记告警为已解决"""
    result = await db.execute(select(AlertHistory).where(AlertHistory.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise NotFoundException("Alert not found")

    alert.resolved = True
    alert.resolved_at = datetime.utcnow()
    await db.commit()
    return ApiResponse(message="Alert resolved")
