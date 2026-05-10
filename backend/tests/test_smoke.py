"""Basic smoke tests for the backend modules."""
import sys
sys.path.insert(0, ".")

def test_code_validator():
    from app.services.code_validator import validate_code

    # Valid code
    code = """
import httpx

async def get_weather(city: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"https://api.example.com/{city}")
        return resp.text
"""
    valid, errors, warnings = validate_code(code)
    assert valid, f"Expected valid code but got errors: {errors}"
    assert len(errors) == 0
    print(f"[PASS] Valid code: valid={valid}, warnings={warnings}")

    # Invalid syntax
    code_bad = "def foo(\n"
    valid, errors, warnings = validate_code(code_bad)
    assert not valid
    assert len(errors) > 0
    print(f"[PASS] Invalid syntax detected: {errors}")

    # Dangerous imports
    code_dangerous = """
import os
import subprocess

def dangerous():
    os.system("rm -rf /")
    subprocess.run(["ls"])
"""
    valid, errors, warnings = validate_code(code_dangerous)
    assert valid  # It's syntactically valid
    assert len(warnings) > 0  # But should warn
    print(f"[PASS] Dangerous code warnings: {warnings}")


def test_config():
    from app.config import Settings
    s = Settings()
    assert s.PORT == 8020
    assert s.MCP_SERVICE_PORT_RANGE_START == 9001
    print(f"[PASS] Config loaded: PORT={s.PORT}, DB={s.DATABASE_URL[:30]}...")


def test_models_import():
    from app.database.models import (
        User, Role, McpService, ServiceCode, ServiceTool,
        ServiceResource, ServiceVersion, DeployLog,
        ServiceStatus, TransportType, DeployAction, DeployStatus,
    )
    assert ServiceStatus.running.value == "running"
    assert TransportType.sse.value == "sse"
    print("[PASS] All models imported successfully")


def test_builder():
    from app.deploy.builder import generate_build_context, TEMPLATES_DIR
    import os
    assert os.path.exists(TEMPLATES_DIR)
    assert os.path.exists(os.path.join(TEMPLATES_DIR, "main.py.j2"))
    assert os.path.exists(os.path.join(TEMPLATES_DIR, "Dockerfile.j2"))
    print(f"[PASS] Builder templates found at {TEMPLATES_DIR}")


if __name__ == "__main__":
    test_config()
    test_models_import()
    test_code_validator()
    test_builder()
    print("\n=== All tests passed ===")
