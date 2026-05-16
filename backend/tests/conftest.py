"""Test fixtures for MCPilot backend integration tests."""
import os

# Must set environment variables BEFORE importing any app module
# because app.config.Settings() is evaluated at module import time.
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing")
os.environ.setdefault("ADMIN_PASSWORD", "testadmin123")
os.environ.setdefault("ADMIN_USERNAME", "admin")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.models import Role, User
from app.main import app
from app.database.session import get_db
from app.auth.service import hash_password

# ---------------------------------------------------------------------------
# Test database engine (SQLite in-memory with StaticPool to share state)
# ---------------------------------------------------------------------------

test_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False,
)
TestSessionLocal = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


# Enable SQLite foreign key support (required for CASCADE deletes)
@event.listens_for(test_engine.sync_engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


async def override_get_db():
    async with TestSessionLocal() as session:
        yield session


# Override FastAPI dependency so all endpoints use the test database
app.dependency_overrides[get_db] = override_get_db


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
async def setup_database():
    """Create tables and seed essential data before each test; drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default roles and admin user (mirrors app.main._seed_defaults)
    async with TestSessionLocal() as db:
        default_roles = {
            "admin": ["*"],
            "developer": [
                "services:read", "services:write", "services:deploy", "services:logs"
            ],
            "operator": [
                "services:read", "services:deploy", "services:logs", "services:lifecycle"
            ],
            "viewer": ["services:read", "services:logs"],
        }
        for role_name, perms in default_roles.items():
            db.add(Role(name=role_name, permissions=perms))
        await db.commit()

        # Create admin user
        result = await db.execute(select(Role).where(Role.name == "admin"))
        admin_role = result.scalar_one()
        admin = User(
            username="admin",
            email="admin@example.com",
            hashed_password=hash_password("testadmin123"),
            role_id=admin_role.id,
        )
        db.add(admin)
        await db.commit()

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client():
    """Async HTTP client that talks to the FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_headers(client: AsyncClient):
    """Login as the seeded admin user and return Authorization headers."""
    resp = await client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "testadmin123",
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    data = resp.json()
    return {"Authorization": f"Bearer {data['access_token']}"}
