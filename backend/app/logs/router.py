import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, McpService, DeployLog
from app.deploy.runner import get_docker_client, stream_container_logs

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/services/{service_id}/logs", tags=["logs"])


@router.websocket("/stream")
async def websocket_log_stream(websocket: WebSocket, service_id: int):
    """WebSocket endpoint for real-time log streaming."""
    await websocket.accept()

    try:
        # Get service (simplified auth for WS - token in query param)
        async with AsyncSession(bind=websocket.app.state.engine) if hasattr(websocket.app.state, 'engine') else _get_session() as db:
            result = await db.execute(select(McpService).where(McpService.id == service_id))
            svc = result.scalar_one_or_none()

        if not svc or not svc.container_id:
            await websocket.send_text("No container running")
            await websocket.close()
            return

        client = get_docker_client()

        # Stream logs in a separate thread to avoid blocking
        def _stream():
            return stream_container_logs(client, svc.container_id)

        loop = asyncio.get_event_loop()
        for line in await loop.run_in_executor(None, lambda: list(_limited_stream(client, svc.container_id, 200))):
            await websocket.send_text(line)

        client.close()
        await websocket.close()

    except WebSocketDisconnect:
        logger.debug(f"WebSocket disconnected for service {service_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass


def _limited_stream(client, container_id: str, max_lines: int):
    """Get limited log lines from container."""
    count = 0
    for line in stream_container_logs(client, container_id):
        yield line
        count += 1
        if count >= max_lines:
            break


async def _get_session():
    from app.database.session import AsyncSessionLocal
    return AsyncSessionLocal()


# Deploy logs (history)
deploy_logs_router = APIRouter(prefix="/services/{service_id}/deploy-logs", tags=["deploy-logs"])


@deploy_logs_router.get("/")
async def get_deploy_logs(
    service_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DeployLog)
        .where(DeployLog.service_id == service_id)
        .order_by(DeployLog.created_at.desc())
        .limit(20)
    )
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "action": log.action.value,
            "status": log.status.value,
            "log_output": log.log_output[:2000] if log.log_output else "",
            "triggered_by": log.triggered_by,
            "created_at": log.created_at.isoformat() if log.created_at else "",
        }
        for log in logs
    ]
