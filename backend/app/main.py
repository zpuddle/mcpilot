import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal, Role, User
from app.auth.service import hash_password
from app.deploy.health_checker import HealthChecker

logger = logging.getLogger(__name__)
health_checker = HealthChecker(interval=30)


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

    # Start health checker
    health_checker.start()

    yield

    # Shutdown
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
    description="MCP Service Management Platform API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.auth.router import router as auth_router
from app.users.router import router as users_router, roles_router
from app.services.router import router as services_router
from app.tools.router import router as tools_router
from app.deploy.router import router as deploy_router, admin_router as docker_admin_router
from app.versions.router import router as versions_router
from app.logs.router import router as logs_router, deploy_logs_router

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


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "mcpilot"}


@app.get("/api/v1/dashboard/stats")
async def dashboard_stats(db=None):
    from sqlalchemy import func
    from app.database import get_db, McpService, ServiceStatus
    from fastapi import Depends

    # This is a simplified version
    return {"message": "Dashboard stats endpoint"}
