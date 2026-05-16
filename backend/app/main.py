import logging
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select
from docker.errors import DockerException

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal, Role, User
from app.auth.service import hash_password
from app.deploy.health_checker import HealthChecker
from app.monitoring.checker import AlertChecker
from app.common.exceptions import AppException
from app.audit.middleware import AuditMiddleware
from app.templates.seed import seed_templates

logger = logging.getLogger(__name__)
health_checker = HealthChecker(interval=30)
alert_checker = AlertChecker(interval=60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))
    logger.info("Starting MCPilot Backend...")

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default roles and admin user
    await _seed_defaults()

    # Seed built-in templates
    async with AsyncSessionLocal() as db:
        await seed_templates(db)

    # Start health checker
    health_checker.start()

    # Start alert checker
    alert_checker.start()

    yield

    # Shutdown
    alert_checker.stop()
    health_checker.stop()
    await engine.dispose()


async def _seed_defaults():
    """Create default roles and admin user if they don't exist."""
    async with AsyncSessionLocal() as db:
        # Create default roles
        default_roles = {
            "admin": ["*"],
            "developer": ["services:read", "services:write", "services:deploy", "services:logs"],
            "operator": ["services:read", "services:deploy", "services:logs", "services:lifecycle"],
            "viewer": ["services:read", "services:logs"],
        }

        for role_name, perms in default_roles.items():
            result = await db.execute(select(Role).where(Role.name == role_name))
            if not result.scalar_one_or_none():
                db.add(Role(name=role_name, permissions=perms))

        await db.commit()

        # Create admin user
        result = await db.execute(select(User).where(User.username == settings.ADMIN_USERNAME))
        if not result.scalar_one_or_none():
            result = await db.execute(select(Role).where(Role.name == "admin"))
            admin_role = result.scalar_one()
            admin = User(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role_id=admin_role.id,
            )
            db.add(admin)
            await db.commit()
            logger.info(f"Created admin user: {settings.ADMIN_USERNAME}")


# Create app
app = FastAPI(
    title="MCPilot",
    description="MCP Service Management Platform API - 管理 MCP 服务的全生命周期",
    version="1.0.0",
    openapi_tags=[
        {"name": "auth", "description": "认证与授权 - 登录、注册、令牌刷新"},
        {"name": "services", "description": "MCP 服务管理 - 服务的创建、编辑、删除和代码管理"},
        {"name": "tools", "description": "工具与资源建模 - Tools 和 Resources 的参数化配置"},
        {"name": "deploy", "description": "部署与容器管理 - Docker 镜像构建、容器启停、生命周期控制"},
        {"name": "versions", "description": "版本管理与回滚 - 服务版本快照和回滚操作"},
        {"name": "logs", "description": "日志与监控 - 实时日志流和部署历史"},
        {"name": "admin", "description": "管理员操作 - 用户管理、角色管理、Docker 资源清理"},
    ],
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Audit middleware (after CORS)
app.add_middleware(AuditMiddleware)

# Include routers
from app.auth.router import router as auth_router
from app.users.router import router as users_router, roles_router
from app.services.router import router as services_router
from app.tools.router import router as tools_router
from app.deploy.router import router as deploy_router, admin_router as docker_admin_router
from app.versions.router import router as versions_router
from app.logs.router import router as logs_router, deploy_logs_router
from app.audit.router import router as audit_router
from app.templates.router import router as templates_router
from app.monitoring.router import router as monitoring_router
from app.dependencies.router import router as dependencies_router

app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(roles_router, prefix="/api/v1")
app.include_router(services_router, prefix="/api/v1")
app.include_router(tools_router, prefix="/api/v1")
app.include_router(deploy_router, prefix="/api/v1")
app.include_router(versions_router, prefix="/api/v1")
app.include_router(logs_router, prefix="/api/v1")
app.include_router(deploy_logs_router, prefix="/api/v1")
app.include_router(docker_admin_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")
app.include_router(templates_router, prefix="/api/v1")
app.include_router(monitoring_router, prefix="/api/v1")
app.include_router(dependencies_router, prefix="/api/v1")


# --- Exception Handlers ---


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(DockerException)
async def docker_exception_handler(request: Request, exc: DockerException):
    logger.error(f"Docker error on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=503,
        content={"detail": "Docker service error, please check container runtime"}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "mcpilot"}

