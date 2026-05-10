import shutil
import logging
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import (
    get_db, User, McpService, ServiceCode, ServiceTool, ServiceResource,
    ServiceStatus, DeployLog, DeployAction, DeployStatus,
)
from app.auth.dependencies import get_current_user, require_permissions
from app.deploy.port_allocator import allocate_port
from app.deploy.builder import generate_build_context
from app.deploy.runner import (
    get_docker_client, build_image, run_container,
    stop_container, start_container, restart_container,
    remove_container, get_container_status, get_container_logs,
    stream_container_logs,
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


@router.post("/deploy", response_model=ApiResponse)
async def deploy_service(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:deploy"])),
):
    """Build Docker image and start the MCP service container."""
    svc = await _get_service(service_id, user, db)

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

    except Exception as e:
        logger.error(f"Deploy failed for {svc.slug}: {e}")
        svc.status = ServiceStatus.error
        deploy_log.status = DeployStatus.failed
        deploy_log.log_output = str(e)
        await db.commit()
        raise AppException(f"Deploy failed: {str(e)}")

    finally:
        # Clean up build directory
        if build_dir:
            try:
                shutil.rmtree(build_dir)
            except Exception:
                pass


@router.post("/start", response_model=ApiResponse)
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


@router.post("/stop", response_model=ApiResponse)
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


@router.post("/restart", response_model=ApiResponse)
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


@router.get("/status")
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


@router.get("/logs")
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


@router.delete("/container", response_model=ApiResponse)
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


# ─── Admin: Resource Management (safe cleanup by naming rules) ───────────────

from app.auth.dependencies import require_admin

admin_router = APIRouter(prefix="/admin/docker", tags=["admin-docker"])


@admin_router.get("/containers")
async def list_all_managed_containers(_: User = Depends(require_admin)):
    """List all Docker containers created by this platform (matched by label + name prefix)."""
    client = get_docker_client()
    containers = list_managed_containers(client)
    client.close()
    return {"containers": containers, "count": len(containers)}


@admin_router.get("/images")
async def list_all_managed_images(_: User = Depends(require_admin)):
    """List all Docker images created by this platform (matched by label + name prefix)."""
    client = get_docker_client()
    images = list_managed_images(client)
    client.close()
    return {"images": images, "count": len(images)}


@admin_router.post("/cleanup/images", response_model=ApiResponse)
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


@admin_router.post("/cleanup/containers", response_model=ApiResponse)
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
    return ApiResponse(message="Container removed")
