import logging
import httpx

logger = logging.getLogger(__name__)


async def notify_alert(alert_type: str, message: str, notify_method: str = "log", webhook_url: str = None):
    """发送告警通知"""
    logger.warning(f"[ALERT] {alert_type}: {message}")

    if notify_method == "webhook" and webhook_url:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(webhook_url, json={
                    "alert_type": alert_type,
                    "message": message,
                })
        except Exception as e:
            logger.error(f"Failed to send webhook alert: {e}")
