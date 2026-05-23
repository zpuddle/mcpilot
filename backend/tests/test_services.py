"""Service management integration tests."""
import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.database.models import (
    DeployAction,
    DeployLog,
    DeployStatus,
    McpService,
    ServiceStatus,
    User,
)


class TestServiceCRUD:
    """Tests for service create / list / get / update / delete."""

    async def test_create_service(self, client: AsyncClient, auth_headers: dict):
        resp = await client.post("/api/v1/services/", json={
            "name": "Weather Service",
            "description": "Provides weather data",
            "transport_type": "sse",
        }, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Weather Service"
        assert data["slug"] == "weather-service"
        assert data["status"] == "draft"
        assert data["transport_type"] == "sse"

    async def test_list_services(self, client: AsyncClient, auth_headers: dict):
        # Create a service first
        await client.post("/api/v1/services/", json={
            "name": "List Test Service",
        }, headers=auth_headers)

        resp = await client.get("/api/v1/services/", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1
        items = data["data"]
        assert any(s["name"] == "List Test Service" for s in items)

    async def test_get_service_detail(self, client: AsyncClient, auth_headers: dict):
        # Create
        create_resp = await client.post("/api/v1/services/", json={
            "name": "Detail Test",
            "description": "Test description",
        }, headers=auth_headers)
        service_id = create_resp.json()["id"]

        # Get detail
        resp = await client.get(f"/api/v1/services/{service_id}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == service_id
        assert data["name"] == "Detail Test"
        assert data["description"] == "Test description"

    async def test_update_service(self, client: AsyncClient, auth_headers: dict):
        # Create
        create_resp = await client.post("/api/v1/services/", json={
            "name": "Update Test",
        }, headers=auth_headers)
        service_id = create_resp.json()["id"]

        # Update
        resp = await client.put(f"/api/v1/services/{service_id}", json={
            "description": "Updated description",
            "transport_type": "streamable_http",
        }, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["description"] == "Updated description"
        assert data["transport_type"] == "streamable_http"

    async def test_delete_service(self, client: AsyncClient, auth_headers: dict):
        # Create
        create_resp = await client.post("/api/v1/services/", json={
            "name": "Delete Test",
        }, headers=auth_headers)
        service_id = create_resp.json()["id"]

        # Delete
        resp = await client.delete(f"/api/v1/services/{service_id}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["success"] is True

        # Verify deleted
        resp = await client.get(f"/api/v1/services/{service_id}", headers=auth_headers)
        assert resp.status_code == 404


class TestServiceCode:
    """Tests for service code management and validation."""

    async def _create_service(self, client: AsyncClient, auth_headers: dict) -> int:
        resp = await client.post("/api/v1/services/", json={
            "name": "Code Test Service",
        }, headers=auth_headers)
        return resp.json()["id"]

    async def test_save_code(self, client: AsyncClient, auth_headers: dict):
        service_id = await self._create_service(client, auth_headers)

        code = 'async def hello(name: str) -> str:\n    return f"Hello, {name}!"'
        resp = await client.put(
            f"/api/v1/services/{service_id}/code",
            json={"code": code},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True

        # Verify saved
        get_resp = await client.get(
            f"/api/v1/services/{service_id}/code", headers=auth_headers
        )
        assert get_resp.status_code == 200
        assert get_resp.json()["code"] == code

    async def test_validate_code_valid(self, client: AsyncClient, auth_headers: dict):
        service_id = await self._create_service(client, auth_headers)

        code = (
            "import httpx\n\n"
            "async def get_data(url: str) -> str:\n"
            "    async with httpx.AsyncClient() as c:\n"
            "        resp = await c.get(url)\n"
            "        return resp.text\n"
        )
        resp = await client.post(
            f"/api/v1/services/{service_id}/code/validate",
            json={"code": code},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is True
        assert data["errors"] == []

    async def test_validate_code_invalid(self, client: AsyncClient, auth_headers: dict):
        service_id = await self._create_service(client, auth_headers)

        code = "def broken(\n"  # syntax error
        resp = await client.post(
            f"/api/v1/services/{service_id}/code/validate",
            json={"code": code},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0


class TestServiceDashboard:
    """Tests for dashboard summary endpoints."""

    async def test_dashboard_overview(self, client: AsyncClient, auth_headers: dict, db_session):
        result = await db_session.execute(select(User).where(User.username == "admin"))
        admin = result.scalar_one()

        running = McpService(
            name="Running Overview",
            slug="running-overview",
            owner_id=admin.id,
            status=ServiceStatus.running,
            port=9010,
            current_version=2,
        )
        error = McpService(
            name="Error Overview",
            slug="error-overview",
            owner_id=admin.id,
            status=ServiceStatus.error,
        )
        db_session.add_all([running, error])
        await db_session.flush()

        db_session.add(
            DeployLog(
                service_id=running.id,
                action=DeployAction.build,
                status=DeployStatus.success,
                triggered_by=admin.id,
            )
        )
        await db_session.commit()

        resp = await client.get("/api/v1/services/dashboard/overview", headers=auth_headers)

        assert resp.status_code == 200
        data = resp.json()
        assert data["stats"]["total"] == 2
        assert data["stats"]["running"] == 1
        assert data["stats"]["errors"] == 1
        assert data["stats"]["error"] == 1
        assert data["health"]["running_rate"] == 50
        assert data["health"]["attention_count"] == 1
        assert data["status_breakdown"] == [
            {"status": "draft", "count": 0},
            {"status": "building", "count": 0},
            {"status": "running", "count": 1},
            {"status": "stopped", "count": 0},
            {"status": "error", "count": 1},
        ]
        assert data["recent_services"][0]["name"] in {"Running Overview", "Error Overview"}
        assert data["recent_activities"][0]["service"] == "Running Overview"
        assert data["recent_activities"][0]["user"] == "admin"
