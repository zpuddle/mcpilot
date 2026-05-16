import asyncio
import logging
from datetime import datetime
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.database.models import McpService, AlertRule, AlertHistory, ServiceStatus
from app.monitoring.metrics import get_container_metrics
from app.monitoring.notifier import notify_alert

logger = logging.getLogger(__name__)


class AlertChecker:
    def __init__(self, interval: int = 60):
        self.interval = interval
        self._task = None

    def start(self):
        self._task = asyncio.create_task(self._run())
        logger.info(f"AlertChecker started (interval={self.interval}s)")

    def stop(self):
        if self._task:
            self._task.cancel()
            logger.info("AlertChecker stopped")

    async def _run(self):
        while True:
            try:
                await asyncio.sleep(self.interval)
                await self._check_alerts()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"AlertChecker error: {e}")

    async def _check_alerts(self):
        async with AsyncSessionLocal() as db:
            # 获取所有启用的告警规则
            result = await db.execute(
                select(AlertRule).where(AlertRule.is_enabled == True)
            )
            rules = result.scalars().all()

            for rule in rules:
                try:
                    await self._evaluate_rule(db, rule)
                except Exception as e:
                    logger.error(f"Error evaluating rule {rule.id}: {e}")

            await db.commit()

    async def _evaluate_rule(self, db, rule: AlertRule):
        # 获取目标服务列表
        if rule.service_id:
            result = await db.execute(
                select(McpService).where(McpService.id == rule.service_id)
            )
            services = [result.scalar_one_or_none()]
            services = [s for s in services if s]
        else:
            result = await db.execute(
                select(McpService).where(McpService.status == ServiceStatus.running)
            )
            services = result.scalars().all()

        for service in services:
            if not service.container_id:
                continue

            triggered = False
            message = ""

            if rule.condition_type == "container_down":
                metrics = await get_container_metrics(service.container_id)
                if metrics.get("status") != "running" or "error" in metrics:
                    triggered = True
                    message = f"Service '{service.name}' container is down"

            elif rule.condition_type == "memory_high":
                metrics = await get_container_metrics(service.container_id)
                threshold = float(rule.threshold.replace("%", "")) if rule.threshold else 80
                if metrics.get("memory_percent", 0) > threshold:
                    triggered = True
                    message = f"Service '{service.name}' memory usage {metrics['memory_percent']}% exceeds {threshold}%"

            elif rule.condition_type == "cpu_high":
                metrics = await get_container_metrics(service.container_id)
                threshold = float(rule.threshold.replace("%", "")) if rule.threshold else 80
                if metrics.get("cpu_percent", 0) > threshold:
                    triggered = True
                    message = f"Service '{service.name}' CPU usage {metrics['cpu_percent']}% exceeds {threshold}%"

            elif rule.condition_type == "restart_count":
                metrics = await get_container_metrics(service.container_id)
                threshold = int(rule.threshold) if rule.threshold else 3
                if metrics.get("restart_count", 0) >= threshold:
                    triggered = True
                    message = f"Service '{service.name}' restarted {metrics['restart_count']} times (threshold: {threshold})"

            if triggered:
                # 记录告警历史
                alert = AlertHistory(
                    rule_id=rule.id,
                    service_id=service.id,
                    service_name=service.name,
                    alert_type=rule.condition_type,
                    message=message,
                )
                db.add(alert)

                # 发送通知
                await notify_alert(
                    alert_type=rule.condition_type,
                    message=message,
                    notify_method=rule.notify_method,
                    webhook_url=rule.webhook_url,
                )
