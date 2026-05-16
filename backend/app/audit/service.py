import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import AuditLog
from app.database.session import AsyncSessionLocal

logger = logging.getLogger(__name__)


async def record_audit(
    user_id: int | None,
    username: str,
    action: str,
    resource_type: str,
    resource_id: int | None = None,
    resource_name: str | None = None,
    detail: dict | None = None,
    ip_address: str | None = None,
):
    """异步记录审计日志（fire-and-forget）"""
    try:
        async with AsyncSessionLocal() as db:
            log = AuditLog(
                user_id=user_id,
                username=username,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                resource_name=resource_name,
                detail=detail or {},
                ip_address=ip_address,
            )
            db.add(log)
            await db.commit()
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")


def fire_audit(
    user_id: int | None,
    username: str,
    action: str,
    resource_type: str,
    resource_id: int | None = None,
    resource_name: str | None = None,
    detail: dict | None = None,
    ip_address: str | None = None,
):
    """非阻塞触发审计记录"""
    asyncio.create_task(record_audit(
        user_id=user_id,
        username=username,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        resource_name=resource_name,
        detail=detail,
        ip_address=ip_address,
    ))
