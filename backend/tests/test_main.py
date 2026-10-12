import logging

from fastapi.testclient import TestClient

from backend.app.core.config import settings
from backend.app.core.database import Base
from backend.app.main import app


# ------------------------------------------------------------------------------
# Health check & metadata aplikasi
# ------------------------------------------------------------------------------
def test_root_health_check(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "docs": "/docs",
        "api": f"{settings.API_V1_STR}/tasks",
    }


def test_app_metadata():
    assert app.title == settings.PROJECT_NAME
    assert app.version == "1.0.0"
    assert app.docs_url == "/docs"
    assert app.redoc_url == "/redoc"
    assert app.openapi_url == "/api/openapi.json"


def test_docs_endpoints_are_served(client):
    assert client.get("/docs").status_code == 200
    assert client.get("/redoc").status_code == 200


def test_openapi_schema_lists_task_routes(client):
    schema = client.get("/api/openapi.json").json()
    assert schema["info"]["title"] == settings.PROJECT_NAME
    paths = schema["paths"]
    assert set(paths["/api/tasks"]) == {"get", "post"}
    assert set(paths["/api/tasks/summary"]) == {"get"}
    assert set(paths["/api/tasks/{id}"]) == {"get", "put", "delete"}
    assert set(paths["/api/tasks/{id}/audit-logs"]) == {"get"}
    assert paths["/api/tasks"]["post"]["tags"] == ["Tasks"]


def test_unknown_route_returns_404(client):
    assert client.get("/api/tidak-ada").status_code == 404
    # Router hanya dipasang di bawah prefix /api
    assert client.get("/tasks").status_code == 404


# ------------------------------------------------------------------------------
# Custom handler RequestValidationError
# ------------------------------------------------------------------------------
def test_validation_handler_shape_for_body_errors(client):
    response = client.post("/api/tasks", json={"title": "T", "status": "Salah"})
    assert response.status_code == 422
    body = response.json()
    assert set(body) == {"detail", "errors"}
    assert body["detail"] == "Data masukan tidak valid."
    assert len(body["errors"]) == 1
    error = body["errors"][0]
    assert set(error) == {"field", "message", "type"}
    # Segmen "body" dibuang agar nama field cocok dengan nama input di form frontend
    assert error["field"] == "status"
    assert error["type"] == "enum"


def test_validation_handler_keeps_non_body_location(client):
    error = client.get("/api/tasks", params={"page": 0}).json()["errors"][0]
    assert error["field"] == "query -> page"
    assert error["type"] == "greater_than_equal"

    error = client.get("/api/tasks/abc").json()["errors"][0]
    assert error["field"] == "path -> id"


def test_validation_handler_model_level_error_has_empty_field(client):
    # Error dari model_validator (due_date lampau) tidak terikat ke satu field
    response = client.post("/api/tasks", json={"title": "T", "due_date": "2000-01-01T00:00:00Z"})
    assert response.status_code == 422
    assert response.json()["errors"][0]["field"] == ""


def test_validation_handler_missing_body(client):
    response = client.post("/api/tasks")
    assert response.status_code == 422
    assert response.json()["errors"][0]["type"] == "missing"


# ------------------------------------------------------------------------------
# CORS
# ------------------------------------------------------------------------------
def test_cors_allows_configured_origin(client):
    origin = settings.CORS_ORIGINS[0]
    response = client.get("/", headers={"Origin": origin})
    assert response.headers["access-control-allow-origin"] == origin
    assert response.headers["access-control-allow-credentials"] == "true"


def test_cors_preflight_for_configured_origin(client):
    origin = settings.CORS_ORIGINS[0]
    response = client.options(
        "/api/tasks",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    for method in ("GET", "POST", "PUT", "DELETE"):
        assert method in response.headers["access-control-allow-methods"]


def test_cors_rejects_unknown_origin(client):
    response = client.get("/", headers={"Origin": "http://evil.example"})
    assert "access-control-allow-origin" not in response.headers

    preflight = client.options(
        "/api/tasks",
        headers={"Origin": "http://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert preflight.status_code == 400


# ------------------------------------------------------------------------------
# Lifespan (startup)
# ------------------------------------------------------------------------------
def test_lifespan_creates_schema_on_startup(monkeypatch, caplog):
    calls = []
    monkeypatch.setattr(Base.metadata, "create_all", lambda bind: calls.append(bind))
    caplog.set_level(logging.INFO, logger="uvicorn.error")

    with TestClient(app):
        pass

    assert len(calls) == 1
    assert "Database schema initialized successfully." in caplog.text


def test_lifespan_survives_database_failure(monkeypatch, caplog):
    def explode(bind):
        raise RuntimeError("koneksi ditolak")

    monkeypatch.setattr(Base.metadata, "create_all", explode)
    caplog.set_level(logging.WARNING, logger="uvicorn.error")

    # Aplikasi tetap menyala walaupun database tidak bisa dihubungi saat startup
    with TestClient(app) as test_client:
        assert test_client.get("/").status_code == 200

    assert "Could not initialize database on startup" in caplog.text
    assert "koneksi ditolak" in caplog.text
