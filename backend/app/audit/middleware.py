import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.audit.service import fire_audit

logger = logging.getLogger(__name__)

# 需要审计的路径模式和对应操作
AUDIT_PATHS = {
    ("POST", "/api/v1/auth/login"): ("login", "auth"),
    ("POST", "/api/v1/services"): ("create", "service"),
    ("DELETE", "/api/v1/services/"): ("delete", "service"),
    ("POST", "/api/v1/services/", "/deploy"): ("deploy", "service"),
    ("POST", "/api/v1/services/", "/start"): ("start", "service"),
    ("POST", "/api/v1/services/", "/stop"): ("stop", "service"),
    ("POST", "/api/v1/services/", "/restart"): ("restart", "service"),
}


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # 只记录成功的写操作
        if request.method in ("POST", "PUT", "DELETE") and 200 <= response.status_code < 300:
            try:
                self._try_record(request, response)
            except Exception as e:
                logger.debug(f"Audit middleware skip: {e}")

        return response

    def _try_record(self, request: Request, response: Response):
        path = request.url.path
        method = request.method

        # 简单推断操作类型
        action = "unknown"
        resource_type = "unknown"

        if method == "POST":
            action = "create"
        elif method == "PUT":
            action = "update"
        elif method == "DELETE":
            action = "delete"

        # 从路径推断资源类型
        if "/services" in path:
            resource_type = "service"
            if "/deploy" in path:
                action = "deploy"
            elif "/start" in path:
                action = "start"
            elif "/stop" in path:
                action = "stop"
            elif "/restart" in path:
                action = "restart"
        elif "/auth/login" in path:
            action = "login"
            resource_type = "auth"
        elif "/users" in path:
            resource_type = "user"
        elif "/roles" in path:
            resource_type = "role"
        elif "/templates" in path:
            resource_type = "template"

        # 获取用户信息（从 request.state，如果认证中间件已设置）
        username = "anonymous"
        user_id = None
        if hasattr(request.state, "user"):
            user = request.state.user
            username = getattr(user, "username", "unknown")
            user_id = getattr(user, "id", None)

        ip_address = request.client.host if request.client else None

        fire_audit(
            user_id=user_id,
            username=username,
            action=action,
            resource_type=resource_type,
            ip_address=ip_address,
        )
