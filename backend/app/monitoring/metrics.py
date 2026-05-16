import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
import docker

logger = logging.getLogger(__name__)
_executor = ThreadPoolExecutor(max_workers=4)


def _get_docker_client():
    return docker.from_env()


def _collect_stats(container_id: str) -> dict:
    """同步函数：从 Docker 获取容器 stats"""
    client = _get_docker_client()
    try:
        container = client.containers.get(container_id)
        stats = container.stats(stream=False)

        # 计算 CPU 百分比
        cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - stats["precpu_stats"]["cpu_usage"]["total_usage"]
        system_delta = stats["cpu_stats"]["system_cpu_usage"] - stats["precpu_stats"]["system_cpu_usage"]
        num_cpus = stats["cpu_stats"].get("online_cpus", 1)
        cpu_percent = (cpu_delta / system_delta) * num_cpus * 100.0 if system_delta > 0 else 0.0

        # 内存
        mem_usage = stats["memory_stats"].get("usage", 0)
        mem_limit = stats["memory_stats"].get("limit", 1)
        mem_percent = (mem_usage / mem_limit) * 100.0

        # 重启次数
        restart_count = container.attrs.get("RestartCount", 0)

        return {
            "cpu_percent": round(cpu_percent, 2),
            "memory_usage_mb": round(mem_usage / 1024 / 1024, 2),
            "memory_limit_mb": round(mem_limit / 1024 / 1024, 2),
            "memory_percent": round(mem_percent, 2),
            "restart_count": restart_count,
            "status": container.status,
        }
    except docker.errors.NotFound:
        return {"error": "Container not found"}
    except Exception as e:
        logger.error(f"Failed to collect metrics for {container_id}: {e}")
        return {"error": str(e)}


async def get_container_metrics(container_id: str) -> dict:
    """异步包装：在线程池中执行同步 Docker 调用"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, _collect_stats, container_id)
