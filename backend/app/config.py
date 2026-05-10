from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8020
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://mcpadmin:mcpadmin123@localhost:5432/mcpilot"

    # JWT
    SECRET_KEY: str = "change-this-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Docker
    DOCKER_HOST: Optional[str] = None
    MCP_SERVICE_PORT_RANGE_START: int = 9001
    MCP_SERVICE_PORT_RANGE_END: int = 9999
    MCP_SERVICE_NETWORK: str = "mcp-services-net"
    MCP_SERVICE_MEMORY_LIMIT: str = "512m"
    MCP_SERVICE_CPU_LIMIT: float = 1.0

    # Naming convention for all Docker resources created by this platform
    # Used to safely identify our resources vs other programs' resources
    MCP_RESOURCE_PREFIX: str = "mcp-svc-"
    MCP_LABEL_KEY: str = "managed-by"
    MCP_LABEL_VALUE: str = "mcpilot"

    # First admin
    ADMIN_USERNAME: str = "admin"
    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_PASSWORD: str = "admin123"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
