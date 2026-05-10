from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import McpService
from app.config import settings


async def allocate_port(db: AsyncSession) -> int:
    """Find the next available port in the configured range."""
    result = await db.execute(
        select(McpService.port)
        .where(McpService.port.isnot(None))
        .order_by(McpService.port)
    )
    used_ports = {row[0] for row in result.fetchall()}

    for port in range(settings.MCP_SERVICE_PORT_RANGE_START, settings.MCP_SERVICE_PORT_RANGE_END + 1):
        if port not in used_ports:
            return port

    raise RuntimeError("No available ports in the configured range")


async def release_port(db: AsyncSession, service_id: int):
    """Release port assigned to a service."""
    result = await db.execute(select(McpService).where(McpService.id == service_id))
    svc = result.scalar_one_or_none()
    if svc:
        svc.port = None
        await db.commit()
