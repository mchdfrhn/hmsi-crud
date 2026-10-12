from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend import seed as seed_module
from backend.app.models.task import Task, TaskPriority, TaskStatus


@pytest.fixture(name="seed_db")
def fixture_seed_db(monkeypatch):
    """Database in-memory khusus seed (seed() membuat tabel dan meng-commit sendiri)."""
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    monkeypatch.setattr(seed_module, "engine", engine)
    monkeypatch.setattr(seed_module, "SessionLocal", factory)
    yield factory
    engine.dispose()


def test_dummy_tasks_are_well_formed():
    assert len(seed_module.DUMMY_TASKS) == 12
    for item in seed_module.DUMMY_TASKS:
        assert set(item) == {
            "title", "description", "status", "priority",
            "assignee", "due_offset_days", "created_offset_days",
        }
        assert 0 < len(item["title"]) <= 100
        assert isinstance(item["status"], TaskStatus)
        assert isinstance(item["priority"], TaskPriority)
        # Tugas tidak boleh dibuat "di masa depan"
        assert item["created_offset_days"] <= 0


def test_dummy_tasks_cover_every_status_and_priority():
    assert {item["status"] for item in seed_module.DUMMY_TASKS} == set(TaskStatus)
    assert {item["priority"] for item in seed_module.DUMMY_TASKS} == set(TaskPriority)


def test_dummy_tasks_include_overdue_examples():
    overdue = [
        item
        for item in seed_module.DUMMY_TASKS
        if item["status"] != TaskStatus.DONE and item["due_offset_days"] < 0
    ]
    assert len(overdue) == 2


def test_seed_inserts_all_dummy_tasks(seed_db, capsys):
    seed_module.seed()

    session = seed_db()
    try:
        tasks = session.query(Task).all()
        assert len(tasks) == len(seed_module.DUMMY_TASKS)
        assert {task.title for task in tasks} == {item["title"] for item in seed_module.DUMMY_TASKS}
        for task in tasks:
            assert task.due_date is not None
            assert task.created_at == task.updated_at
            assert task.created_at <= datetime.now(timezone.utc).replace(tzinfo=None)
    finally:
        session.close()

    output = capsys.readouterr().out
    assert "Berhasil menambahkan 12 dummy tasks!" in output
    assert "Total tugas saat ini di database: 12" in output


def test_seed_is_additive_when_run_twice(seed_db, capsys):
    seed_module.seed()
    seed_module.seed()

    session = seed_db()
    try:
        assert session.query(Task).count() == 24
    finally:
        session.close()
    assert "Total tugas saat ini di database: 24" in capsys.readouterr().out


def test_seed_rolls_back_and_reports_on_error(seed_db, monkeypatch, capsys):
    monkeypatch.setattr(
        seed_module,
        "DUMMY_TASKS",
        [*seed_module.DUMMY_TASKS[:2], {**seed_module.DUMMY_TASKS[2], "title": None}],
    )

    seed_module.seed()

    assert "Error seeding database:" in capsys.readouterr().out
    session = seed_db()
    try:
        assert session.query(Task).count() == 0
    finally:
        session.close()
