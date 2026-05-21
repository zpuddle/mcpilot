import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional

from app.database.session import get_db
from app.database.models import AuditLog
from app.auth.dependencies import get_current_user, require_permissions

router = APIRouter(tags=["admin"])


@router.get("/audit-logs", summary="审计日志列表", description="查询操作审计日志，仅管理员可用")
async def list_audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(["*"])),
):
    query = select(AuditLog)
    count_query = select(func.count(AuditLog.id))

    if user_id:
        query = query.where(AuditLog.user_id == user_id)
        count_query = count_query.where(AuditLog.user_id == user_id)
    if action:
        query = query.where(AuditLog.action == action)
        count_query = count_query.where(AuditLog.action == action)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
        count_query = count_query.where(AuditLog.resource_type == resource_type)

    total = (await db.execute(count_query)).scalar() or 0

    query = query.order_by(desc(AuditLog.created_at))
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    logs = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "size": size,
        "data": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "username": log.username,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "resource_name": log.resource_name,
                "detail": log.detail,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
    }


@router.get("/audit-logs/export", summary="导出审计日志", description="导出审计日志为 CSV 文件")
async def export_audit_logs(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(["*"])),
):
    """Export audit logs as CSV file."""
    query = select(AuditLog)

    if user_id:
        query = query.where(AuditLog.user_id == user_id)
    if action:
        query = query.where(AuditLog.action == action)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)

    query = query.order_by(desc(AuditLog.created_at))
    result = await db.execute(query)
    logs = result.scalars().all()

    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "User ID", "Username", "Action", "Resource Type", "Resource ID", "Resource Name", "Detail", "IP Address", "Created At"])

    for log in logs:
        writer.writerow([
            log.id,
            log.user_id,
            log.username,
            log.action,
            log.resource_type,
            log.resource_id,
            log.resource_name or "",
            str(log.detail) if log.detail else "",
            log.ip_address or "",
            log.created_at.isoformat() if log.created_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_logs.csv"},
    )
