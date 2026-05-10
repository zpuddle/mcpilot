import logging
from typing import Optional, Generator
import docker
from docker.errors import NotFound, APIError

from app.config import settings

logger = logging.getLogger(__name__)


def get_docker_client() -> docker.DockerClient:
    """Create a Docker client."""
    kwargs = {}
    if settings.DOCKER_HOST:
        kwargs["base_url"] = settings.DOCKER_HOST
    return docker.from_env(**kwargs)


def ensure_network(client: docker.DockerClient, network_name: str):
    """Ensure the MCP services network exists."""
    try:
        client.networks.get(network_name)
    except NotFound:
        client.networks.create(network_name, driver="bridge")
        logger.info(f"Created Docker network: {network_name}")


def build_image(client: docker.DockerClient, build_dir: str, tag: str) -> Generator[str, None, None]:
    """Build a Docker image from a directory. Yields log lines."""
    logger.info(f"Building image {tag} from {build_dir}")
    try:
        for chunk in client.api.build(
            path=build_dir,
            tag=tag,
            rm=True,
            forcerm=True,
            decode=True,
            labels={
                settings.MCP_LABEL_KEY: settings.MCP_LABEL_VALUE,
            },
        ):
            if "stream" in chunk:
                line = chunk["stream"].strip()
                if line:
                    yield line
            elif "error" in chunk:
                error_msg = chunk["error"].strip()
                yield f"ERROR: {error_msg}"
                raise RuntimeError(f"Docker build failed: {error_msg}")
    except APIError as e:
        yield f"ERROR: Docker API error: {e}"
        raise


def run_container(
    client: docker.DockerClient,
    image_tag: str,
    container_name: str,
    port: int,
    env_vars: Optional[dict] = None,
) -> str:
    """Run a container from an image. Returns container ID."""
    ensure_network(client, settings.MCP_SERVICE_NETWORK)

    # Remove existing container with same name if any
    try:
        existing = client.containers.get(container_name)
        existing.stop(timeout=10)
        existing.remove(force=True)
        logger.info(f"Removed existing container: {container_name}")
    except NotFound:
        pass

    environment = env_vars or {}

    container = client.containers.run(
        image=image_tag,
        name=container_name,
        detach=True,
        ports={f"{port}/tcp": port},
        environment=environment,
        network=settings.MCP_SERVICE_NETWORK,
        mem_limit=settings.MCP_SERVICE_MEMORY_LIMIT,
        nano_cpus=int(settings.MCP_SERVICE_CPU_LIMIT * 1e9),
        restart_policy={"Name": "unless-stopped"},
        cap_drop=["ALL"],
        read_only=False,
        tmpfs={"/tmp": "size=100m"},
    )

    logger.info(f"Started container {container_name} (ID: {container.short_id})")
    return container.id


def stop_container(client: docker.DockerClient, container_id: str):
    """Stop a running container."""
    try:
        container = client.containers.get(container_id)
        container.stop(timeout=10)
        logger.info(f"Stopped container {container_id[:12]}")
    except NotFound:
        logger.warning(f"Container {container_id[:12]} not found")


def start_container(client: docker.DockerClient, container_id: str):
    """Start a stopped container."""
    try:
        container = client.containers.get(container_id)
        container.start()
        logger.info(f"Started container {container_id[:12]}")
    except NotFound:
        raise RuntimeError(f"Container {container_id[:12]} not found")


def restart_container(client: docker.DockerClient, container_id: str):
    """Restart a container."""
    try:
        container = client.containers.get(container_id)
        container.restart(timeout=10)
        logger.info(f"Restarted container {container_id[:12]}")
    except NotFound:
        raise RuntimeError(f"Container {container_id[:12]} not found")


def remove_container(client: docker.DockerClient, container_id: str):
    """Remove a container and optionally its image."""
    try:
        container = client.containers.get(container_id)
        container.stop(timeout=10)
        container.remove(force=True)
        logger.info(f"Removed container {container_id[:12]}")
    except NotFound:
        pass


def get_container_status(client: docker.DockerClient, container_id: str) -> Optional[str]:
    """Get the status of a container. Returns None if not found."""
    try:
        container = client.containers.get(container_id)
        return container.status
    except NotFound:
        return None


def get_container_logs(client: docker.DockerClient, container_id: str, tail: int = 100) -> str:
    """Get recent logs from a container."""
    try:
        container = client.containers.get(container_id)
        logs = container.logs(tail=tail, timestamps=True).decode("utf-8", errors="replace")
        return logs
    except NotFound:
        return "Container not found"


def stream_container_logs(client: docker.DockerClient, container_id: str) -> Generator[str, None, None]:
    """Stream logs from a container."""
    try:
        container = client.containers.get(container_id)
        for line in container.logs(stream=True, follow=True, timestamps=True):
            yield line.decode("utf-8", errors="replace").strip()
    except NotFound:
        yield "Container not found"


# ─── Safe Cleanup (only touches resources created by this platform) ──────────


def _is_our_resource_name(name: str) -> bool:
    """Check if a container/image name matches our naming convention."""
    return name.startswith(settings.MCP_RESOURCE_PREFIX)


def _has_our_label(labels: dict) -> bool:
    """Check if a Docker resource has our management label."""
    return labels.get(settings.MCP_LABEL_KEY) == settings.MCP_LABEL_VALUE


def list_managed_containers(client: docker.DockerClient) -> list:
    """List all containers managed by this platform (matching label + name prefix).

    Returns list of dicts with container info.
    """
    containers = client.containers.list(
        all=True,
        filters={"label": f"{settings.MCP_LABEL_KEY}={settings.MCP_LABEL_VALUE}"},
    )
    results = []
    for c in containers:
        if _is_our_resource_name(c.name):
            results.append({
                "id": c.short_id,
                "name": c.name,
                "status": c.status,
                "image": c.image.tags[0] if c.image.tags else str(c.image.id)[:12],
            })
    return results


def list_managed_images(client: docker.DockerClient) -> list:
    """List all images managed by this platform (matching label + name prefix).

    Returns list of dicts with image info.
    """
    images = client.images.list(
        filters={"label": f"{settings.MCP_LABEL_KEY}={settings.MCP_LABEL_VALUE}"},
    )
    results = []
    for img in images:
        tags = img.tags or []
        # Only include images whose tags match our prefix
        our_tags = [t for t in tags if t.split(":")[0].startswith(settings.MCP_RESOURCE_PREFIX)]
        if our_tags:
            results.append({
                "id": img.short_id,
                "tags": our_tags,
                "size_mb": round(img.attrs.get("Size", 0) / 1024 / 1024, 1),
            })
    return results


def cleanup_old_images(client: docker.DockerClient, keep_latest: int = 3) -> list:
    """Remove old MCP service images, keeping the latest N versions per service.

    SAFETY: Only removes images that:
    1. Have our management label (managed-by=mcpilot)
    2. Have tags matching our prefix (mcp-svc-*)
    3. Are not currently used by any running container

    Returns list of removed image tags.
    """
    images = client.images.list(
        filters={"label": f"{settings.MCP_LABEL_KEY}={settings.MCP_LABEL_VALUE}"},
    )

    # Group by service slug (image name without version tag)
    service_images: dict = {}  # service_name -> [(version_int, image)]
    for img in images:
        for tag in (img.tags or []):
            # Expected format: mcp-svc-{slug}:v{N}
            if not tag.startswith(settings.MCP_RESOURCE_PREFIX):
                continue
            parts = tag.split(":")
            if len(parts) != 2:
                continue
            svc_name = parts[0]
            version_str = parts[1]
            # Parse version number
            try:
                version_num = int(version_str.lstrip("v"))
            except ValueError:
                continue
            if svc_name not in service_images:
                service_images[svc_name] = []
            service_images[svc_name].append((version_num, img, tag))

    removed = []
    for svc_name, versions in service_images.items():
        # Sort by version descending, keep latest N
        versions.sort(key=lambda x: x[0], reverse=True)
        to_remove = versions[keep_latest:]
        for _, img, tag in to_remove:
            try:
                # Double-check: don't remove if any container is using it
                containers_using = client.containers.list(
                    all=True, filters={"ancestor": tag}
                )
                if containers_using:
                    logger.info(f"Skipping {tag}: still in use by {len(containers_using)} container(s)")
                    continue
                client.images.remove(tag, force=False)
                removed.append(tag)
                logger.info(f"Removed old image: {tag}")
            except Exception as e:
                logger.warning(f"Failed to remove image {tag}: {e}")

    return removed


def cleanup_stopped_containers(client: docker.DockerClient) -> list:
    """Remove stopped containers that belong to this platform.

    SAFETY: Only removes containers that:
    1. Have our management label (managed-by=mcpilot)
    2. Have names matching our prefix (mcp-svc-*)
    3. Are in 'exited' or 'dead' state

    Returns list of removed container names.
    """
    containers = client.containers.list(
        all=True,
        filters={
            "label": f"{settings.MCP_LABEL_KEY}={settings.MCP_LABEL_VALUE}",
            "status": "exited",
        },
    )

    removed = []
    for c in containers:
        if not _is_our_resource_name(c.name):
            continue
        try:
            c.remove(force=True)
            removed.append(c.name)
            logger.info(f"Removed stopped container: {c.name}")
        except Exception as e:
            logger.warning(f"Failed to remove container {c.name}: {e}")

    return removed
