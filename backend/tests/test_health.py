"""Uji endpoint dasar. Dijalankan dengan `uv run pytest`."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "geosafe-api",
        "version": app.version,
    }
