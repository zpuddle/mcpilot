import asyncio
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import McpService, ServiceStatus, AsyncSessionLocal
from app.deploy.runner import get_docker_client, get_container_status

logger = logging.getLogger(__name__)


class HealthChecker:
    """Background task that monitors MCP service health."""

    def __init__(self, interval: int = 30):
        self.interval = interval
        self._task: asyncio.Task = None

    def start(self):
        self._task = asyncio.create_task(self._run())
        logger.info("Health checker started")

    def stop(self):
        if self._task:
            self._task.cancel()
            logger.info("Health checker stopped")

    async def _run(self):
        while True:
            try:
                await self._check_all()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health checker error: {e}")
            await asyncio.sleep(self.interval)

    async def _check_all(self):
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(McpService).where(McpService.status == ServiceStatus.running)
            )
            services = result.scalars().all()

            if not services:
                return

            client = get_docker_client()
            for svc in services:
                if not svc.container_id:
                    continue

                status = get_container_status(client, svc.container_id)
                if status != "running":
                    logger.warning(
                        f"Service '{svc.name}' container is {status}, marking as error"
                    )
                    svc.status = ServiceStatus.error
                    await db.commit()

            client.close()
