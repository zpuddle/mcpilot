<div align="center">

# MCPilot

**A self-hosted platform for building, deploying, and managing MCP (Model Context Protocol) services — all from your browser.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB.svg)](https://python.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg)](https://docker.com)

<!-- 
Screenshots placeholder — replace with actual screenshots:
![Dashboard](docs/screenshots/dashboard.png)
![Code Editor](docs/screenshots/editor.png)
![Deploy](docs/screenshots/deploy.png)
-->

</div>

---

MCPilot gives you a full-featured web UI to create MCP-compliant services, write Python handlers in a Monaco editor, define tools and resources visually, and deploy everything to Docker containers with a single click. No CLI juggling, no manual Dockerfiles — just build, deploy, and manage.

## Features

### Core

- 🛠️ **Service Management** — Create, edit, and delete MCP services through a clean web interface
- ✏️ **Monaco Code Editor** — Write Python handler code with syntax highlighting, IntelliSense, and validation
- 🧩 **Visual Tool & Resource Builder** — Define input/output parameters for Tools and Resources without touching JSON
- ⚙️ **Transport Configuration** — Choose between SSE and Streamable HTTP; manage environment variables per service
- 🐳 **One-Click Docker Deploy** — Auto-build images and run containers; no manual Docker commands needed
- 🔄 **Lifecycle Control** — Start, stop, and restart services from the dashboard
- 📜 **Real-Time Logs** — Stream container logs via WebSocket directly in the browser
- 🕐 **Version Management** — Track every deployment version and roll back instantly
- 🔐 **Auth & RBAC** — JWT-based authentication with role-based access control

### Advanced

- 📋 **Audit Logging** — Track every operation with a full audit trail
- 📦 **Template Marketplace** — Bootstrap new services from community or custom templates
- 📊 **Monitoring & Alerts** — Track CPU, memory, and container health; get notified on anomalies
- 🔗 **Dependency Management** — Declare inter-service dependencies with topological sorting and cycle detection
- 🚀 **Multi-Instance Deploy** — Scale services with multiple replicas behind auto-configured Nginx load balancing
- 🎨 **Theming** — Light, dark, and system-follow themes out of the box

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12 · FastAPI · SQLAlchemy (async) · Pydantic v2 |
| Frontend | React 19 · TypeScript 6 · Vite 8 · Ant Design 6 |
| State | Zustand 5 · TanStack Query 5 |
| Database | PostgreSQL 16 |
| Editor | Monaco Editor |
| MCP SDK | FastMCP (Python) |
| Containers | Docker SDK for Python |
| Testing | pytest · pytest-asyncio |

## Getting Started

### Prerequisites

- **Docker** and **Docker Compose** (v2+)
- Or, for manual setup: Python 3.12+, Node.js 20+, PostgreSQL 16

### Option A: Docker Compose (Recommended)

```bash
# Clone the repo
git clone https://github.com/your-org/mcpilot.git
cd mcpilot

# Configure environment
cp .env.example .env
# Edit .env — at minimum, set SECRET_KEY and ADMIN_PASSWORD

# Launch everything
docker compose up -d
```

Access the application at **http://localhost** (port 80). The API is also available directly at **http://localhost:8020**.

### Option B: Manual Setup

**1. Database**

Create a PostgreSQL database named `mcpilot`, or adjust `DATABASE_URL` in `.env`.

**2. Backend**

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8020 --reload
```

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Default Credentials

| Field | Value |
|---|---|
| Username | `admin` (or your `ADMIN_USERNAME`) |
| Password | Value of `ADMIN_PASSWORD` in `.env` |

## Configuration

All configuration is done via environment variables. Copy `.env.example` to `.env` and adjust as needed.

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | **Yes** | — | Secret key for JWT signing. **Change in production.** |
| `ADMIN_PASSWORD` | **Yes** | — | Initial admin account password |
| `ADMIN_USERNAME` | No | `admin` | Initial admin account username |
| `ADMIN_EMAIL` | No | `admin@example.com` | Admin email address |
| `DATABASE_URL` | No | `postgresql+asyncpg://mcpadmin:mcpadmin123@localhost:5432/mcpilot` | Async PostgreSQL connection string |
| `CORS_ORIGINS` | No | `http://localhost:5173,http://localhost:3000` | Allowed CORS origins (comma-separated) |
| `HOST` | No | `0.0.0.0` | Server bind address |
| `PORT` | No | `8020` | Server port |
| `LOG_LEVEL` | No | `INFO` | Logging level |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `15` | JWT access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | JWT refresh token TTL |
| `DOCKER_HOST` | No | *(system default)* | Docker daemon socket |
| `MCP_SERVICE_PORT_RANGE_START` | No | `9001` | Start of port range for MCP services |
| `MCP_SERVICE_PORT_RANGE_END` | No | `9999` | End of port range for MCP services |
| `MCP_SERVICE_NETWORK` | No | `mcp-services-net` | Docker network for MCP services |
| `MCP_SERVICE_MEMORY_LIMIT` | No | `512m` | Memory limit per service container |
| `MCP_SERVICE_CPU_LIMIT` | No | `1.0` | CPU limit per service container |

## Project Structure

```
mcpilot/
├── docker-compose.yml          # Full-stack orchestration
├── .env.example                # Environment template
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint
│   │   ├── config.py           # Settings & env parsing
│   │   ├── auth/               # JWT authentication & RBAC
│   │   ├── users/              # User management
│   │   ├── services/           # MCP service CRUD & dashboard stats
│   │   ├── tools/              # Tools & Resources CRUD
│   │   ├── deploy/             # Deployment engine (Docker + multi-instance)
│   │   ├── versions/           # Version tracking & rollback
│   │   ├── logs/               # Real-time log streaming (WebSocket)
│   │   ├── audit/              # Operation audit trail
│   │   ├── templates/          # Service templates
│   │   ├── monitoring/         # Health checks & alerting
│   │   ├── dependencies/       # Inter-service dependency graph
│   │   ├── database/           # SQLAlchemy models & sessions
│   │   └── common/             # Shared utilities & exceptions
│   ├── tests/                  # pytest test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                # Typed API client
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable UI components
│   │   ├── store/              # Zustand state stores
│   │   ├── theme/              # Theme tokens & system
│   │   ├── styles/             # Global CSS
│   │   └── router/             # Route definitions
│   └── package.json
├── specs/                      # Design documents
└── templates/examples/         # Starter templates
```

## API Documentation

Once the backend is running, interactive API docs are available at:

- **Swagger UI** — [http://localhost:8020/docs](http://localhost:8020/docs)
- **ReDoc** — [http://localhost:8020/redoc](http://localhost:8020/redoc)

All API endpoints are prefixed with `/api/v1`.

## Development

```bash
# Run backend tests
cd backend
pytest

# Run with coverage
pytest --cov=app

# Lint frontend
cd frontend
npm run lint
```

## Roadmap

- [ ] Plugin system for custom deployment targets (Kubernetes, cloud providers)
- [ ] Built-in MCP service testing & debugging playground
- [ ] CLI companion tool for CI/CD integration
- [ ] Service marketplace with community-contributed templates
- [ ] OpenTelemetry-based distributed tracing
- [ ] Multi-tenant workspace support

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feat/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feat/amazing-feature`)
5. **Open** a Pull Request

Please make sure your code passes existing tests and follows the project's coding style.

## License

This project is licensed under the [MIT License](LICENSE).
