import shutil
import logging
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Body
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import (
    get_db, User, McpService, ServiceCode, ServiceTool, ServiceResource,
    ServiceStatus, DeployLog, DeployAction, DeployStatus, ServiceInstance,
)
from app.auth.dependencies import get_current_user, require_permissions
from app.deploy.port_allocator import allocate_port
from app.deploy.builder import generate_build_context
from app.deploy.runner import (
    get_docker_client, build_image, run_container,
    stop_container, start_container, restart_container,
    remove_container, get_container_status, get_container_logs,
    stream_container_logs, deploy_multi_instance, scale_instances,
    stop_multi_instance, get_instance_status,
    list_managed_containers, list_managed_images,
    cleanup_old_images, cleanup_stopped_containers,
)
from app.common.exceptions import NotFoundException, ForbiddenException, AppException
from app.common.responses import ApiResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/services/{service_id}", tags=["deploy"])


async def _get_service(service_id: int, user: User, db: AsyncSession) -> McpService:
    result = await db.execute(
        select(McpService).options(selectinload(McpService.owner)).where(McpService.id == service_id)
    )
    svc = result.scalar_one_or_none()
    if not svc:
        raise NotFoundException("Service not found")
    if user.role.name != "admin" and svc.owner_id != user.id:
        raise ForbiddenException("You don't own this service")
    return svc


@router.post("/deploy", response_model=ApiResponse, summary="部署服务", description="构建 Docker 镜像并启动 MCP 服务容器")
async def deploy_service(
    service_id: int,
    force: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:deploy"])),
):
    """Build Docker image and start the MCP service container."""
    svc = await _get_service(service_id, user, db)

    # Check runtime dependencies
    from app.database.models import ServiceDependency
    deps_result = await db.execute(
        select(ServiceDependency).where(
            ServiceDependency.service_id == service_id,
            ServiceDependency.dependency_type == "runtime"
        )
    )
    deps = deps_result.scalars().all()

    if deps and not force:
        not_ready = []
        for dep in deps:
            dep_svc_result = await db.execute(select(McpService).where(McpService.id == dep.depends_on_id))
            dep_service = dep_svc_result.scalar_one_or_none()
            if dep_service and dep_service.status != ServiceStatus.running:
                not_ready.append(dep_service.name)

        if not_ready:
            raise AppException(
                detail=f"Dependencies not ready: {', '.join(not_ready)}. Deploy them first or use force=true",
                status_code=400
            )

    # Get code
    result = await db.execute(select(ServiceCode).where(ServiceCode.service_id == service_id))
    code_record = result.scalar_one_or_none()
    if not code_record or not code_record.code.strip():
        raise AppException("No code to deploy. Write handler code first.")

    # Get tools
    result = await db.execute(select(ServiceTool).where(ServiceTool.service_id == service_id))
    tools = list(result.scalars().all())
    if not tools:
        raise AppException("No tools defined. Add at least one tool before deploying.")

    # Get resources
    result = await db.execute(select(ServiceResource).where(ServiceResource.service_id == service_id))
    resources = list(result.scalars().all())

    # Allocate port if needed
    if not svc.port:
        svc.port = await allocate_port(db)

    # Update status
    svc.status = ServiceStatus.building
    await db.commit()

    # Create deploy log
    deploy_log = DeployLog(
        service_id=service_id,
        action=DeployAction.build,
        status=DeployStatus.running,
        triggered_by=user.id,
    )
    db.add(deploy_log)
    await db.commit()

    build_dir = None
    try:
        # Generate build context
        build_dir = generate_build_context(svc, code_record.code, tools, resources)

        # Build Docker image
        client = get_docker_client()
        version = svc.current_version + 1
        image_tag = f"mcp-svc-{svc.slug}:v{version}"

        log_lines = []
        for line in build_image(client, build_dir, image_tag):
            log_lines.append(line)

        # Stop old container if running
        if svc.container_id:
            try:
                stop_container(client, svc.container_id)
                remove_container(client, svc.container_id)
            except Exception as e:
                logger.warning(f"Failed to stop old container: {e}")

        # Run new container
        container_name = f"mcp-svc-{svc.slug}"
        container_id = run_container(
            client, image_tag, container_name, svc.port, svc.env_vars or {}
        )

        # Update service record
        svc.container_id = container_id
        svc.image_tag = image_tag
        svc.current_version = version
        svc.status = ServiceStatus.running

        # Update deploy log
        deploy_log.status = DeployStatus.success
        deploy_log.log_output = "\n".join(log_lines)

        await db.commit()
        client.close()

        return ApiResponse(
            message=f"Service deployed successfully (v{version})",
            data={"version": version, "port": svc.port, "container_id": container_id[:12]},
        )

    except AppException as e:
        svc.status = ServiceStatus.error
        deploy_log.status = DeployStatus.failed
        # Record full build log + error without truncation
        full_log = "\n".join(log_lines) + "\n\nERROR: " + str(e.detail)
        deploy_log.log_output = full_log
        await db.commit()
        raise
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Deploy failed for {svc.slug}: {error_msg}", exc_info=True)
        svc.status = ServiceStatus.error
        deploy_log.status = DeployStatus.failed
        # Record full build log + error without truncation
        full_log = "\n".join(log_lines) + "\n\nERROR: " + error_msg
        deploy_log.log_output = full_log
        await db.commit()
        raise AppException(f"Deploy failed: {error_msg}")

    finally:
        # Clean up build directory
        if build_dir:
            try:
                shutil.rmtree(build_dir)
            except Exception:
                pass


@router.post("/start", response_model=ApiResponse, summary="启动服务", description="启动已停止的服务容器")
async def start_service(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:deploy"])),
):
    svc = await _get_service(service_id, user, db)
    if not svc.container_id:
        raise AppException("Service has no container. Deploy first.")

    client = get_docker_client()
    start_container(client, svc.container_id)
    svc.status = ServiceStatus.running
    await db.commit()
    client.close()

    return ApiResponse(message="Service started")


@router.post("/stop", response_model=ApiResponse, summary="停止服务", description="停止运行中的服务容器")
async def stop_service(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:deploy"])),
):
    svc = await _get_service(service_id, user, db)
    if not svc.container_id:
        raise AppException("Service has no container.")

    client = get_docker_client()
    stop_container(client, svc.container_id)
    svc.status = ServiceStatus.stopped
    await db.commit()
    client.close()

    return ApiResponse(message="Service stopped")


@router.post("/restart", response_model=ApiResponse, summary="重启服务", description="重启服务容器")
async def restart_service(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:deploy"])),
):
    svc = await _get_service(service_id, user, db)
    if not svc.container_id:
        raise AppException("Service has no container.")

    client = get_docker_client()
    restart_container(client, svc.container_id)
    svc.status = ServiceStatus.running
    await db.commit()
    client.close()

    return ApiResponse(message="Service restarted")


@router.get("/status", summary="查询状态", description="获取服务和容器的当前运行状态")
async def get_service_status(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    svc = await _get_service(service_id, user, db)
    container_status = None
    if svc.container_id:
        client = get_docker_client()
        container_status = get_container_status(client, svc.container_id)
        client.close()

    return {
        "service_status": svc.status.value,
        "container_status": container_status,
        "port": svc.port,
        "image_tag": svc.image_tag,
        "version": svc.current_version,
    }


@router.get("/logs", summary="容器日志", description="获取服务容器的运行日志")
async def get_service_logs(
    service_id: int,
    tail: int = 100,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    svc = await _get_service(service_id, user, db)
    if not svc.container_id:
        return {"logs": "No container running"}

    client = get_docker_client()
    logs = get_container_logs(client, svc.container_id, tail=tail)
    client.close()
    return {"logs": logs}


@router.delete("/container", response_model=ApiResponse, summary="删除容器", description="删除服务关联的 Docker 容器")
async def remove_service_container(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:deploy"])),
):
    svc = await _get_service(service_id, user, db)
    if svc.container_id:
        client = get_docker_client()
        remove_container(client, svc.container_id)
        client.close()

    svc.container_id = None
    svc.status = ServiceStatus.stopped
    await db.commit()
    return ApiResponse(message="Container removed")


@router.put("/scale", response_model=ApiResponse, summary="调整副本数", description="调整服务的运行副本数量")
async def scale_service(
    service_id: int,
    replicas: int = Body(..., ge=1, le=10, embed=True),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:deploy"])),
):
    """Scale the service to the specified number of replicas."""
    svc = await _get_service(service_id, user, db)

    if not svc.image_tag:
        raise AppException("Service has no image. Deploy first before scaling.")

    if not svc.port:
        raise AppException("Service has no allocated port.")

    client = get_docker_client()
    old_replicas = svc.replicas or 1

    try:
        if replicas == 1:
            # Scale down to single instance: remove multi-instance setup
            if old_replicas > 1:
                stop_multi_instance(client, svc.slug, old_replicas)

            # Run single container
            container_name = f"mcp-svc-{svc.slug}"
            container_id = run_container(
                client, svc.image_tag, container_name, svc.port, svc.env_vars or {}
            )
            svc.container_id = container_id
            svc.replicas = 1
            svc.status = ServiceStatus.running

            # Clear instance records
            result = await db.execute(
                select(ServiceInstance).where(ServiceInstance.service_id == service_id)
            )
            for inst in result.scalars().all():
                await db.delete(inst)

        else:
            # Stop single container if exists
            if svc.container_id and old_replicas <= 1:
                try:
                    stop_container(client, svc.container_id)
                    remove_container(client, svc.container_id)
                except Exception:
                    pass

            # Deploy / scale multi-instance
            base_port = svc.port
            if old_replicas > 1:
                result_data = scale_instances(
                    client, svc.slug, old_replicas, replicas,
                    svc.image_tag, base_port, svc.port, svc.env_vars or {}
                )
            else:
                result_data = deploy_multi_instance(
                    client, svc.slug, replicas, svc.image_tag,
                    base_port, svc.port, svc.env_vars or {}
                )

            svc.container_id = result_data["lb_container_id"]
            svc.replicas = replicas
            svc.status = ServiceStatus.running

            # Update instance records
            result = await db.execute(
                select(ServiceInstance).where(ServiceInstance.service_id == service_id)
            )
            for inst in result.scalars().all():
                await db.delete(inst)
            await db.flush()

            for inst_data in result_data["instances"]:
                instance = ServiceInstance(
                    service_id=service_id,
                    instance_index=inst_data["index"],
                    container_id=inst_data["container_id"],
                    internal_port=inst_data["port"],
                    status="running",
                )
                db.add(instance)

        await db.commit()
        client.close()

        return ApiResponse(
            message=f"Service scaled to {replicas} replica(s)",
            data={"replicas": replicas},
        )

    except AppException:
        client.close()
        raise
    except Exception as e:
        client.close()
        raise AppException(f"Scale failed: {str(e)}")


@router.get("/instances", summary="查看实例状态", description="获取服务各实例的运行状态")
async def list_instances(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get the status of all service instances."""
    svc = await _get_service(service_id, user, db)

    result = await db.execute(
        select(ServiceInstance).where(ServiceInstance.service_id == service_id)
    )
    instances = result.scalars().all()

    if not instances:
        return []

    client = get_docker_client()
    instance_list = []
    for inst in instances:
        container_status = None
        if inst.container_id:
            container_status = get_instance_status(client, inst.container_id)
        instance_list.append({
            "id": inst.id,
            "service_id": inst.service_id,
            "instance_index": inst.instance_index,
            "container_id": inst.container_id,
            "internal_port": inst.internal_port,
            "status": container_status or inst.status,
        })
    client.close()

    return instance_list


# ─── Admin: Resource Management (safe cleanup by naming rules) ───────────────

from app.auth.dependencies import require_admin

admin_router = APIRouter(prefix="/admin/docker", tags=["admin"])


@admin_router.get("/containers", summary="管理容器列表", description="列出平台创建的所有 Docker 容器")
async def list_all_managed_containers(_: User = Depends(require_admin)):
    """List all Docker containers created by this platform (matched by label + name prefix)."""
    client = get_docker_client()
    containers = list_managed_containers(client)
    client.close()
    return {"containers": containers, "count": len(containers)}


@admin_router.get("/images", summary="管理镜像列表", description="列出平台创建的所有 Docker 镜像")
async def list_all_managed_images(_: User = Depends(require_admin)):
    """List all Docker images created by this platform (matched by label + name prefix)."""
    client = get_docker_client()
    images = list_managed_images(client)
    client.close()
    return {"images": images, "count": len(images)}


@admin_router.post("/cleanup/images", response_model=ApiResponse, summary="清理旧镜像", description="清理旧版本的 MCP 服务镜像，保留最新 N 个版本")
async def admin_cleanup_images(keep_latest: int = 3, _: User = Depends(require_admin)):
    """Manually clean up old MCP service images.

    SAFETY: Only removes images that have our label AND name prefix AND are not in use.
    Keeps the latest N versions per service.
    """
    client = get_docker_client()
    removed = cleanup_old_images(client, keep_latest=keep_latest)
    client.close()
    return ApiResponse(
        message=f"Cleaned up {len(removed)} old image(s)",
        data={"removed": removed},
    )


@admin_router.post("/cleanup/containers", response_model=ApiResponse, summary="清理停止容器", description="清理已停止的 MCP 服务容器")
async def admin_cleanup_containers(_: User = Depends(require_admin)):
    """Manually clean up stopped/exited MCP containers.

    SAFETY: Only removes containers that have our label AND name prefix AND are stopped.
    """
    client = get_docker_client()
    removed = cleanup_stopped_containers(client)
    client.close()
    return ApiResponse(
        message=f"Cleaned up {len(removed)} stopped container(s)",
        data={"removed": removed},
    )


@admin_router.post("/containers/{container_id}/start", response_model=ApiResponse, summary="启动容器", description="启动指定的平台管理容器")
async def admin_start_container(container_id: str, _: User = Depends(require_admin)):
    """Start a specific managed container by ID.

    SAFETY: Only starts containers that have our label AND name prefix.
    """
    client = get_docker_client()
    try:
        container = client.containers.get(container_id)
    except Exception:
        client.close()
        raise NotFoundException("Container not found")

    # Verify it's our container
    from app.config import settings
    labels = container.labels or {}
    if labels.get(settings.MCP_LABEL_KEY) != settings.MCP_LABEL_VALUE:
        client.close()
        raise ForbiddenException("Not a platform-managed container")

    container.start()
    client.close()
    return ApiResponse(message=f"Container {container_id} started")


@admin_router.post("/containers/{container_id}/stop", response_model=ApiResponse, summary="停止容器", description="停止指定的平台管理容器")
async def admin_stop_container(container_id: str, _: User = Depends(require_admin)):
    """Stop a specific managed container by ID.

    SAFETY: Only stops containers that have our label AND name prefix.
    """
    client = get_docker_client()
    try:
        container = client.containers.get(container_id)
    except Exception:
        client.close()
        raise NotFoundException("Container not found")

    # Verify it's our container
    from app.config import settings
    labels = container.labels or {}
    if labels.get(settings.MCP_LABEL_KEY) != settings.MCP_LABEL_VALUE:
        client.close()
        raise ForbiddenException("Not a platform-managed container")

    container.stop()
    client.close()
    return ApiResponse(message=f"Container {container_id} stopped")


@admin_router.delete("/containers/{container_id}", response_model=ApiResponse, summary="删除容器", description="删除指定的平台管理容器")
async def admin_remove_container(container_id: str, _: User = Depends(require_admin)):
    """Remove a specific managed container by ID.

    SAFETY: Only removes containers that have our label AND name prefix.
    """
    client = get_docker_client()
    try:
        container = client.containers.get(container_id)
    except Exception:
        client.close()
        raise NotFoundException("Container not found")

    # Verify it's our container
    from app.config import settings
    labels = container.labels or {}
    if labels.get(settings.MCP_LABEL_KEY) != settings.MCP_LABEL_VALUE:
        client.close()
        raise ForbiddenException("Not a platform-managed container")

    container.remove(force=True)
    client.close()
    return ApiResponse(message=f"Container {container_id} removed")
