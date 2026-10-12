import os

# Paksa aplikasi memakai SQLite in-memory SEBELUM modul backend diimpor, supaya test
# tidak pernah menyentuh (atau membutuhkan) PostgreSQL sungguhan dari .env.
os.environ["DATABASE_URL"] = "sqlite://"

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.core.database import Base
from backend.app.api.deps import get_db
from backend.app.main import app
from backend.app.models.task import Task, TaskPriority, TaskStatus

# Database in-memory terisolasi khusus untuk automated testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(name="db_session")
def fixture_db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(name="client")
def fixture_client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_in(**delta) -> str:
    """ISO-8601 UTC relatif terhadap saat ini, mis. iso_in(days=2) atau iso_in(days=-2)."""
    return (utc_now() + timedelta(**delta)).isoformat()


@pytest.fixture(name="make_task")
def fixture_make_task(db_session):
    """
    Menyisipkan Task langsung lewat ORM (melewati validasi TaskCreate), sehingga test
    bisa menyiapkan data yang tidak mungkin dibuat via API, misalnya due_date lampau.
    """
    counter = {"n": 0}

    def _make(**overrides) -> Task:
        counter["n"] += 1
        data = {
            "title": f"Task {counter['n']}",
            "status": TaskStatus.TODO,
            "priority": TaskPriority.MEDIUM,
        }
        data.update(overrides)
        task = Task(**data)
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)
        return task

    return _make
