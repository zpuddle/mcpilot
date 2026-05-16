import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Enum, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database.base import Base


class RoleEnum(str, enum.Enum):
    admin = "admin"
    developer = "developer"
    operator = "operator"
    viewer = "viewer"


class ServiceStatus(str, enum.Enum):
    draft = "draft"
    building = "building"
    running = "running"
    stopped = "stopped"
    error = "error"


class TransportType(str, enum.Enum):
    sse = "sse"
    streamable_http = "streamable_http"
    both = "both"


class DeployAction(str, enum.Enum):
    build = "build"
    start = "start"
    stop = "stop"
    restart = "restart"


class DeployStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    success = "success"
    failed = "failed"


# ─── Users & Roles ───────────────────────────────────────────────────────────


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    permissions = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    role = relationship("Role", back_populates="users")
    services = relationship("McpService", back_populates="owner")


# ─── MCP Services ────────────────────────────────────────────────────────────


class McpService(Base):
    __tablename__ = "mcp_services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    description = Column(Text, default="")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(ServiceStatus), default=ServiceStatus.draft, nullable=False)
    transport_type = Column(Enum(TransportType), default=TransportType.sse, nullable=False)
    port = Column(Integer, nullable=True, unique=True)
    container_id = Column(String(100), nullable=True)
    image_tag = Column(String(300), nullable=True)
    current_version = Column(Integer, default=0)
    replicas = Column(Integer, default=1)
    env_vars = Column(JSON, default=dict)
    extra_dependencies = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="services")
    code = relationship("ServiceCode", back_populates="service", uselist=False, cascade="all, delete-orphan", passive_deletes=True)
    tools = relationship("ServiceTool", back_populates="service", cascade="all, delete-orphan")
    resources = relationship("ServiceResource", back_populates="service", cascade="all, delete-orphan")
    versions = relationship("ServiceVersion", back_populates="service", cascade="all, delete-orphan")
    deploy_logs = relationship("DeployLog", back_populates="service", cascade="all, delete-orphan")


class ServiceCode(Base):
    __tablename__ = "service_code"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("mcp_services.id", ondelete="CASCADE"), unique=True, nullable=False)
    code = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    service = relationship("McpService", back_populates="code")


class ServiceTool(Base):
    __tablename__ = "service_tools"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("mcp_services.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, default="")
    handler_name = Column(String(200), nullable=False)
    input_schema = Column(JSON, default=dict)
    output_schema = Column(JSON, default=dict)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    service = relationship("McpService", back_populates="tools")


class ServiceResource(Base):
    __tablename__ = "service_resources"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("mcp_services.id", ondelete="CASCADE"), nullable=False)
    uri_template = Column(String(500), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, default="")
    mime_type = Column(String(100), default="text/plain")
    handler_name = Column(String(200), nullable=False)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    service = relationship("McpService", back_populates="resources")


# ─── Versions ────────────────────────────────────────────────────────────────


class ServiceVersion(Base):
    __tablename__ = "service_versions"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("mcp_services.id", ondelete="CASCADE"), nullable=False)
    version_tag = Column(String(50), nullable=False)
    code_snapshot = Column(Text, default="")
    tools_snapshot = Column(JSON, default=list)
    config_snapshot = Column(JSON, default=dict)
    changelog = Column(Text, default="")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    service = relationship("McpService", back_populates="versions")


# ─── Deploy Logs ─────────────────────────────────────────────────────────────


class DeployLog(Base):
    __tablename__ = "deploy_logs"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("mcp_services.id", ondelete="CASCADE"), nullable=False)
    action = Column(Enum(DeployAction), nullable=False)
    status = Column(Enum(DeployStatus), default=DeployStatus.pending, nullable=False)
    log_output = Column(Text, default="")
    triggered_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    service = relationship("McpService", back_populates="deploy_logs")


# ─── Audit Logs ─────────────────────────────────────────────────────────────


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(100), nullable=False)
    action = Column(String(50), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(Integer, nullable=True)
    resource_name = Column(String(200), nullable=True)
    detail = Column(JSON, default=dict)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


# ─── Service Templates ──────────────────────────────────────────────────────


class ServiceTemplate(Base):
    __tablename__ = "service_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False)
    description = Column(Text, default="")
    category = Column(String(100), default="general")
    icon = Column(String(50), default="code")
    code_template = Column(Text, nullable=False, default="")
    tools_template = Column(JSON, default=list)
    resources_template = Column(JSON, default=list)
    env_vars_template = Column(JSON, default=dict)
    dependencies = Column(Text, default="")
    is_builtin = Column(Boolean, default=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Monitoring & Alerts ────────────────────────────────────────────────────


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    service_id = Column(Integer, ForeignKey("mcp_services.id", ondelete="CASCADE"), nullable=True)
    condition_type = Column(String(50), nullable=False)  # container_down/memory_high/cpu_high/restart_count
    threshold = Column(String(50), nullable=True)
    is_enabled = Column(Boolean, default=True)
    notify_method = Column(String(50), default="log")  # log/webhook
    webhook_url = Column(String(500), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AlertHistory(Base):
    __tablename__ = "alert_history"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("alert_rules.id", ondelete="SET NULL"), nullable=True)
    service_id = Column(Integer, ForeignKey("mcp_services.id", ondelete="SET NULL"), nullable=True)
    service_name = Column(String(200), nullable=True)
    alert_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Service Dependencies ───────────────────────────────────────────────────


class ServiceDependency(Base):
    __tablename__ = "service_dependencies"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("mcp_services.id", ondelete="CASCADE"), nullable=False)
    depends_on_id = Column(Integer, ForeignKey("mcp_services.id", ondelete="CASCADE"), nullable=False)
    dependency_type = Column(String(50), default="runtime")
    description = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Service Instances ──────────────────────────────────────────────────────


class ServiceInstance(Base):
    __tablename__ = "service_instances"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("mcp_services.id", ondelete="CASCADE"), nullable=False)
    instance_index = Column(Integer, nullable=False)
    container_id = Column(String(100), nullable=True)
    internal_port = Column(Integer, nullable=False)
    status = Column(String(20), default="stopped")
    created_at = Column(DateTime, default=datetime.utcnow)

    service = relationship("McpService", backref="instances")
