"""Authentication flow integration tests."""
import pytest
from httpx import AsyncClient


class TestRegister:
    """Tests for POST /api/v1/auth/register"""

    async def test_register_success(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json={
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "password123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["username"] == "newuser"

    async def test_register_duplicate(self, client: AsyncClient):
        # First registration
        await client.post("/api/v1/auth/register", json={
            "username": "dupuser",
            "email": "dup@test.com",
            "password": "password123",
        })
        # Duplicate registration
        resp = await client.post("/api/v1/auth/register", json={
            "username": "dupuser",
            "email": "dup@test.com",
            "password": "password123",
        })
        assert resp.status_code == 409


class TestLogin:
    """Tests for POST /api/v1/auth/login"""

    async def test_login_success(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/login", json={
            "username": "admin",
            "password": "testadmin123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/login", json={
            "username": "admin",
            "password": "wrongpassword",
        })
        assert resp.status_code == 401


class TestMe:
    """Tests for GET /api/v1/auth/me"""

    async def test_get_me(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "admin"
        assert data["role_name"] == "admin"
        assert data["is_active"] is True

    async def test_access_without_token(self, client: AsyncClient):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code in (401, 403)


class TestRefreshToken:
    """Tests for POST /api/v1/auth/refresh"""

    async def test_refresh_token(self, client: AsyncClient):
        # Login first to get a refresh token
        login_resp = await client.post("/api/v1/auth/login", json={
            "username": "admin",
            "password": "testadmin123",
        })
        refresh_token = login_resp.json()["refresh_token"]

        # Use refresh token to get new tokens
        resp = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_refresh_with_invalid_token(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": "invalid-token-value",
        })
        assert resp.status_code == 401
