import os
import tempfile
import logging
from typing import List
from jinja2 import Environment, FileSystemLoader

from app.database.models import McpService, ServiceTool, ServiceResource

logger = logging.getLogger(__name__)

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")
jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR), autoescape=False)


def generate_build_context(
    service: McpService,
    code: str,
    tools: List[ServiceTool],
    resources: List[ServiceResource],
) -> str:
    """Generate a temporary directory with all files needed to build the Docker image.

    Returns the path to the temporary directory.
    """
    build_dir = tempfile.mkdtemp(prefix=f"mcp-build-{service.slug}-")

    # 1. Write user handlers code
    handlers_path = os.path.join(build_dir, "handlers.py")
    with open(handlers_path, "w", encoding="utf-8") as f:
        f.write(code)

    # 2. Generate main.py from template
    main_template = jinja_env.get_template("main.py.j2")
    main_content = main_template.render(
        service_name=service.name,
        service_slug=service.slug,
        transport=_get_transport_str(service.transport_type),
        port=service.port,
        tools=tools,
        resources=resources,
    )
    main_path = os.path.join(build_dir, "main.py")
    with open(main_path, "w", encoding="utf-8") as f:
        f.write(main_content)

    # 3. Generate requirements.txt
    req_template = jinja_env.get_template("requirements.txt.j2")
    req_content = req_template.render(
        extra_dependencies=service.extra_dependencies or ""
    )
    req_path = os.path.join(build_dir, "requirements.txt")
    with open(req_path, "w", encoding="utf-8") as f:
        f.write(req_content)

    # 4. Generate Dockerfile
    dockerfile_template = jinja_env.get_template("Dockerfile.j2")
    dockerfile_content = dockerfile_template.render(port=service.port)
    dockerfile_path = os.path.join(build_dir, "Dockerfile")
    with open(dockerfile_path, "w", encoding="utf-8") as f:
        f.write(dockerfile_content)

    # 5. Copy healthcheck.py
    healthcheck_template = jinja_env.get_template("healthcheck.py.j2")
    healthcheck_content = healthcheck_template.render(port=service.port)
    healthcheck_path = os.path.join(build_dir, "healthcheck.py")
    with open(healthcheck_path, "w", encoding="utf-8") as f:
        f.write(healthcheck_content)

    logger.info(f"Build context generated at: {build_dir}")
    return build_dir


def _get_transport_str(transport_type) -> str:
    from app.database.models import TransportType
    if transport_type == TransportType.sse:
        return "sse"
    elif transport_type == TransportType.streamable_http:
        return "streamable-http"
    else:
        return "sse"
