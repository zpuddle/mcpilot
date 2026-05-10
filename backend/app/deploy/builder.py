import os
import re
import tempfile
import logging
from typing import List
from jinja2 import Environment, FileSystemLoader

from app.database.models import McpService, ServiceTool, ServiceResource

logger = logging.getLogger(__name__)

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")
jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR), autoescape=False)


_JSON_TO_PY_TYPE = {
    "string": "str",
    "integer": "int",
    "number": "float",
    "boolean": "bool",
    "array": "list",
    "object": "dict",
}


def _json_type_to_python(json_type) -> str:
    if isinstance(json_type, list):
        # e.g. ["string", "null"] -> pick first non-null
        for t in json_type:
            if t != "null":
                return _JSON_TO_PY_TYPE.get(t, "Any")
        return "Any"
    return _JSON_TO_PY_TYPE.get(json_type or "", "Any")


def _build_tool_signature(input_schema) -> tuple:
    """Convert a JSON schema dict into (signature_params, call_kwargs) strings.

    Example input_schema: {"type": "object",
        "properties": {"city": {"type": "string"}, "days": {"type": "integer"}},
        "required": ["city"]}
    Returns: ("city: str, days: int = None", "city=city, days=days")
    """
    if not input_schema or not isinstance(input_schema, dict):
        return "", ""
    properties = input_schema.get("properties") or {}
    required = set(input_schema.get("required") or [])
    params = []
    kwargs = []
    for pname, pschema in properties.items():
        if not isinstance(pschema, dict):
            pschema = {}
        ptype = _json_type_to_python(pschema.get("type"))
        if pname in required:
            params.append(f"{pname}: {ptype}")
        else:
            params.append(f"{pname}: {ptype} = None")
        kwargs.append(f"{pname}={pname}")
    return ", ".join(params), ", ".join(kwargs)


def _build_resource_signature(uri_template: str) -> tuple:
    """Extract {xxx} placeholders from a URI template as str params.

    Example: "users://{id}/profile" -> ("id: str", "id=id")
    """
    if not uri_template:
        return "", ""
    names = re.findall(r"\{([^{}]+)\}", uri_template)
    params = [f"{n}: str" for n in names]
    kwargs = [f"{n}={n}" for n in names]
    return ", ".join(params), ", ".join(kwargs)


def _prepare_tools(tools: List[ServiceTool]) -> list:
    prepared = []
    for t in tools:
        sig, kw = _build_tool_signature(t.input_schema or {})
        prepared.append({
            "name": t.name,
            "description": (t.description or "").replace('"', '\\"'),
            "handler_name": t.handler_name,
            "is_enabled": t.is_enabled,
            "signature": sig,
            "call_kwargs": kw,
        })
    return prepared


def _prepare_resources(resources: List[ServiceResource]) -> list:
    prepared = []
    for r in resources:
        sig, kw = _build_resource_signature(r.uri_template or "")
        prepared.append({
            "uri_template": r.uri_template,
            "name": r.name,
            "description": (r.description or "").replace('"', '\\"'),
            "mime_type": r.mime_type,
            "handler_name": r.handler_name,
            "is_enabled": r.is_enabled,
            "signature": sig,
            "call_kwargs": kw,
        })
    return prepared


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
        tools=_prepare_tools(tools),
        resources=_prepare_resources(resources),
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
