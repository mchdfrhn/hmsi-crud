import runpy
from pathlib import Path

import pytest
import sqlalchemy

from backend.app.api import deps
from backend.app.core import database
from backend.app.core.config import Settings, settings

DATABASE_MODULE_PATH = str(Path(database.__file__))


# ------------------------------------------------------------------------------
# core/config.py
# ------------------------------------------------------------------------------
@pytest.fixture(name="clean_env")
def fixture_clean_env(monkeypatch):
    for name in ("PROJECT_NAME", "API_V1_STR", "DATABASE_URL", "CORS_ORIGINS"):
        monkeypatch.delenv(name, raising=False)
    return monkeypatch


def test_settings_defaults(clean_env):
    config = Settings(_env_file=None)
    assert config.PROJECT_NAME == "Task Management API"
    assert config.API_V1_STR == "/api"
    assert config.DATABASE_URL == "postgresql://postgres:postgres@localhost:5432/task_management"
    assert config.CORS_ORIGINS == ["http://localhost:3000", "http://127.0.0.1:3000"]


def test_settings_read_from_environment(clean_env):
    clean_env.setenv("PROJECT_NAME", "API Lain")
    clean_env.setenv("API_V1_STR", "/v2")
    clean_env.setenv("DATABASE_URL", "sqlite:///contoh.db")

    config = Settings(_env_file=None)
    assert config.PROJECT_NAME == "API Lain"
    assert config.API_V1_STR == "/v2"
    assert config.DATABASE_URL == "sqlite:///contoh.db"


def test_settings_env_file_names_are_case_sensitive(clean_env, tmp_path):
    env_file = tmp_path / ".env"
    env_file.write_text("project_name=huruf kecil\n", encoding="utf-8")
    assert Settings(_env_file=env_file).PROJECT_NAME == "Task Management API"


def test_settings_read_from_env_file(clean_env, tmp_path):
    env_file = tmp_path / ".env"
    env_file.write_text(
        'PROJECT_NAME="Dari File"\n'
        'CORS_ORIGINS="http://a.test, http://b.test"\n'
        "VARIABEL_ASING=diabaikan\n",
        encoding="utf-8",
    )

    config = Settings(_env_file=env_file)
    assert config.PROJECT_NAME == "Dari File"
    assert config.CORS_ORIGINS == ["http://a.test", "http://b.test"]
    assert not hasattr(config, "VARIABEL_ASING")


def test_settings_environment_overrides_env_file(clean_env, tmp_path):
    env_file = tmp_path / ".env"
    env_file.write_text("PROJECT_NAME=Dari File\n", encoding="utf-8")
    clean_env.setenv("PROJECT_NAME", "Dari Env")

    assert Settings(_env_file=env_file).PROJECT_NAME == "Dari Env"


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("http://a.test", ["http://a.test"]),
        ("http://a.test,http://b.test", ["http://a.test", "http://b.test"]),
        ("  http://a.test ,  http://b.test  ", ["http://a.test", "http://b.test"]),
        ("http://a.test,,  ,http://b.test,", ["http://a.test", "http://b.test"]),
        ("", []),
        ("   ", []),
        (["http://a.test", "http://b.test"], ["http://a.test", "http://b.test"]),
        ([], []),
        (None, []),
        (123, []),
    ],
)
def test_cors_origins_validator(clean_env, raw, expected):
    assert Settings(_env_file=None, CORS_ORIGINS=raw).CORS_ORIGINS == expected


def test_cors_origins_from_comma_separated_env(clean_env):
    clean_env.setenv("CORS_ORIGINS", "http://a.test,http://b.test")
    assert Settings(_env_file=None).CORS_ORIGINS == ["http://a.test", "http://b.test"]


def test_settings_singleton_is_a_settings_instance():
    assert isinstance(settings, Settings)
    assert isinstance(settings.CORS_ORIGINS, list)


# ------------------------------------------------------------------------------
# core/database.py
# ------------------------------------------------------------------------------
@pytest.fixture(name="run_database_module")
def fixture_run_database_module(monkeypatch):
    """
    Mengeksekusi ulang database.py di namespace terpisah dengan create_engine palsu,
    sehingga logika normalisasi URL bisa diuji tanpa driver/koneksi database sungguhan
    dan tanpa mengganti Base/engine yang dipakai modul lain.
    """

    def _run(database_url: str) -> dict:
        captured = {}

        def fake_create_engine(url, **kwargs):
            captured["url"] = url
            captured["kwargs"] = kwargs
            return object()

        monkeypatch.setattr(sqlalchemy, "create_engine", fake_create_engine)
        monkeypatch.setattr(settings, "DATABASE_URL", database_url)
        captured["namespace"] = runpy.run_path(DATABASE_MODULE_PATH)
        return captured

    return _run


def test_database_rewrites_legacy_postgres_scheme(run_database_module):
    result = run_database_module("postgres://user:pass@host:5432/db")
    assert result["url"] == "postgresql://user:pass@host:5432/db"
    assert result["kwargs"]["connect_args"] == {}


def test_database_rewrites_only_the_scheme_prefix(run_database_module):
    result = run_database_module("postgres://user:postgres://@host/db")
    assert result["url"] == "postgresql://user:postgres://@host/db"


@pytest.mark.parametrize(
    "url",
    ["postgresql://user:pass@host:5432/db", "postgresql+psycopg2://user:pass@host/db"],
)
def test_database_keeps_modern_postgres_url(run_database_module, url):
    result = run_database_module(url)
    assert result["url"] == url
    assert result["kwargs"]["connect_args"] == {}


@pytest.mark.parametrize("url", ["sqlite://", "sqlite:///./test.db"])
def test_database_sqlite_disables_same_thread_check(run_database_module, url):
    result = run_database_module(url)
    assert result["url"] == url
    assert result["kwargs"]["connect_args"] == {"check_same_thread": False}


def test_database_engine_uses_pool_pre_ping(run_database_module):
    assert run_database_module("sqlite://")["kwargs"]["pool_pre_ping"] is True


def test_database_session_factory_configuration():
    assert database.SessionLocal.kw["autocommit"] is False
    assert database.SessionLocal.kw["autoflush"] is False
    assert database.SessionLocal.kw["bind"] is database.engine


def test_database_base_registers_all_models():
    assert set(database.Base.metadata.tables) == {"tasks", "task_audit_logs"}


# ------------------------------------------------------------------------------
# api/deps.py
# ------------------------------------------------------------------------------
class FakeSession:
    def __init__(self):
        self.closed = False

    def close(self):
        self.closed = True


@pytest.fixture(name="fake_session")
def fixture_fake_session(monkeypatch):
    session = FakeSession()
    monkeypatch.setattr(deps, "SessionLocal", lambda: session)
    return session


def test_get_db_yields_session_and_closes_it(fake_session):
    generator = deps.get_db()
    assert next(generator) is fake_session
    assert fake_session.closed is False

    with pytest.raises(StopIteration):
        next(generator)
    assert fake_session.closed is True


def test_get_db_closes_session_when_request_fails(fake_session):
    generator = deps.get_db()
    next(generator)

    with pytest.raises(RuntimeError):
        generator.throw(RuntimeError("endpoint gagal"))
    assert fake_session.closed is True


def test_get_db_creates_a_new_session_per_request(monkeypatch):
    created = []

    def factory():
        created.append(FakeSession())
        return created[-1]

    monkeypatch.setattr(deps, "SessionLocal", factory)
    first = next(deps.get_db())
    second = next(deps.get_db())
    assert first is not second
    assert len(created) == 2
