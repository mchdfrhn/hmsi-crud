from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from backend.app.models.task import TaskPriority, TaskStatus
from backend.app.schemas import task as task_schema
from backend.app.schemas.audit_log import TaskAuditLogResponse
from backend.app.schemas.task import (
    TaskCreate,
    TaskListResponse,
    TaskResponse,
    TaskSummaryResponse,
    TaskUpdate,
)

# Waktu "sekarang" yang dibekukan untuk menguji toleransi due_date secara deterministik
FROZEN_NOW = datetime(2030, 1, 1, 12, 0, 45, tzinfo=timezone.utc)


@pytest.fixture(name="frozen_now")
def fixture_frozen_now(monkeypatch):
    class FrozenDateTime(datetime):
        @classmethod
        def now(cls, tz=None):
            return FROZEN_NOW.astimezone(tz) if tz else FROZEN_NOW.replace(tzinfo=None)

    monkeypatch.setattr(task_schema, "datetime", FrozenDateTime)
    return FROZEN_NOW


def error_messages(exc_info) -> str:
    return " | ".join(err["msg"] for err in exc_info.value.errors())


# ------------------------------------------------------------------------------
# TaskCreate: nilai default
# ------------------------------------------------------------------------------
def test_task_create_defaults():
    task = TaskCreate(title="Tugas")
    assert task.title == "Tugas"
    assert task.description is None
    assert task.status is TaskStatus.TODO
    assert task.priority is TaskPriority.MEDIUM
    assert task.assignee is None
    assert task.due_date is None


def test_task_create_requires_title():
    with pytest.raises(ValidationError) as exc_info:
        TaskCreate()
    errors = exc_info.value.errors()
    assert errors[0]["loc"] == ("title",)
    assert errors[0]["type"] == "missing"


# ------------------------------------------------------------------------------
# TaskCreate: validasi title
# ------------------------------------------------------------------------------
def test_task_create_strips_title():
    assert TaskCreate(title="   Rapat Mingguan  ").title == "Rapat Mingguan"


@pytest.mark.parametrize("title", ["", " ", "     ", "\t\n"])
def test_task_create_rejects_blank_title(title):
    with pytest.raises(ValidationError) as exc_info:
        TaskCreate(title=title)
    assert "tidak boleh kosong" in error_messages(exc_info)


def test_task_create_title_length_boundary():
    assert len(TaskCreate(title="A" * 100).title) == 100
    with pytest.raises(ValidationError):
        TaskCreate(title="A" * 101)


def test_task_create_title_max_length_checked_before_strip():
    # max_length=100 berlaku pada input mentah: 100 huruf + spasi tetap ditolak
    with pytest.raises(ValidationError):
        TaskCreate(title="A" * 100 + " ")


@pytest.mark.parametrize("title", [None, 123, ["a"]])
def test_task_create_rejects_non_string_title(title):
    with pytest.raises(ValidationError):
        TaskCreate(title=title)


# ------------------------------------------------------------------------------
# TaskCreate: validasi assignee
# ------------------------------------------------------------------------------
def test_task_create_strips_assignee():
    assert TaskCreate(title="T", assignee="  Budi  ").assignee == "Budi"


@pytest.mark.parametrize("assignee", ["", "   ", None])
def test_task_create_blank_assignee_becomes_none(assignee):
    assert TaskCreate(title="T", assignee=assignee).assignee is None


def test_task_create_assignee_length_boundary():
    assert len(TaskCreate(title="T", assignee="B" * 100).assignee) == 100
    with pytest.raises(ValidationError):
        TaskCreate(title="T", assignee="B" * 101)


# ------------------------------------------------------------------------------
# TaskCreate: enum status & priority
# ------------------------------------------------------------------------------
@pytest.mark.parametrize("value, member", [(s.value, s) for s in TaskStatus])
def test_task_create_accepts_every_status(value, member):
    assert TaskCreate(title="T", status=value).status is member


@pytest.mark.parametrize("value, member", [(p.value, p) for p in TaskPriority])
def test_task_create_accepts_every_priority(value, member):
    assert TaskCreate(title="T", priority=value).priority is member


@pytest.mark.parametrize("status", ["Archived", "to do", "TODO", "", None])
def test_task_create_rejects_invalid_status(status):
    with pytest.raises(ValidationError):
        TaskCreate(title="T", status=status)


@pytest.mark.parametrize("priority", ["Urgent", "high", "", None])
def test_task_create_rejects_invalid_priority(priority):
    with pytest.raises(ValidationError):
        TaskCreate(title="T", priority=priority)


# ------------------------------------------------------------------------------
# TaskCreate: aturan bisnis due_date
# ------------------------------------------------------------------------------
def test_task_create_accepts_future_due_date():
    due = datetime.now(timezone.utc) + timedelta(days=1)
    assert TaskCreate(title="T", due_date=due).due_date == due


def test_task_create_rejects_past_due_date():
    with pytest.raises(ValidationError) as exc_info:
        TaskCreate(title="T", due_date=datetime.now(timezone.utc) - timedelta(days=1))
    assert "Tenggat waktu (due_date) tidak boleh lebih awal" in error_messages(exc_info)


def test_task_create_due_date_tolerates_current_minute(frozen_now):
    # Sekarang 12:00:45 -> batas bawah yang diterima adalah 12:00:00
    start_of_minute = frozen_now.replace(second=0, microsecond=0)
    assert TaskCreate(title="T", due_date=start_of_minute).due_date == start_of_minute
    assert TaskCreate(title="T", due_date=frozen_now - timedelta(seconds=30)).due_date


def test_task_create_due_date_rejects_previous_minute(frozen_now):
    just_before = frozen_now.replace(second=0, microsecond=0) - timedelta(microseconds=1)
    with pytest.raises(ValidationError):
        TaskCreate(title="T", due_date=just_before)


def test_task_create_naive_due_date_is_treated_as_utc(frozen_now):
    assert TaskCreate(title="T", due_date=datetime(2030, 1, 1, 12, 0, 0)).due_date.tzinfo is None
    with pytest.raises(ValidationError):
        TaskCreate(title="T", due_date=datetime(2030, 1, 1, 11, 59, 59))


def test_task_create_due_date_compares_across_timezones(frozen_now):
    wib = timezone(timedelta(hours=7))
    # 19:00:10 WIB == 12:00:10 UTC (masih valid), 18:59:00 WIB == 11:59:00 UTC (lampau)
    assert TaskCreate(title="T", due_date=datetime(2030, 1, 1, 19, 0, 10, tzinfo=wib))
    with pytest.raises(ValidationError):
        TaskCreate(title="T", due_date=datetime(2030, 1, 1, 18, 59, 0, tzinfo=wib))


def test_task_create_parses_iso_string_due_date():
    task = TaskCreate(title="T", due_date="2099-12-31T17:00:00Z")
    assert task.due_date == datetime(2099, 12, 31, 17, 0, tzinfo=timezone.utc)


def test_task_create_rejects_malformed_due_date():
    with pytest.raises(ValidationError):
        TaskCreate(title="T", due_date="besok sore")


# ------------------------------------------------------------------------------
# TaskUpdate
# ------------------------------------------------------------------------------
def test_task_update_all_fields_optional():
    update = TaskUpdate()
    assert update.model_dump(exclude_unset=True) == {}


def test_task_update_only_dumps_fields_that_were_sent():
    update = TaskUpdate(status="Done", description=None)
    assert update.model_dump(exclude_unset=True) == {
        "status": TaskStatus.DONE,
        "description": None,
    }


def test_task_update_strips_title():
    assert TaskUpdate(title="  Judul Baru ").title == "Judul Baru"


def test_task_update_allows_null_title():
    assert TaskUpdate(title=None).title is None


@pytest.mark.parametrize("title", ["", "   "])
def test_task_update_rejects_blank_title(title):
    with pytest.raises(ValidationError) as exc_info:
        TaskUpdate(title=title)
    assert "tidak boleh kosong" in error_messages(exc_info)


def test_task_update_title_length_boundary():
    assert len(TaskUpdate(title="A" * 100).title) == 100
    with pytest.raises(ValidationError):
        TaskUpdate(title="A" * 101)


def test_task_update_strips_assignee():
    assert TaskUpdate(assignee="  Siti ").assignee == "Siti"


@pytest.mark.parametrize("assignee", ["", "   ", None])
def test_task_update_blank_assignee_becomes_none(assignee):
    assert TaskUpdate(assignee=assignee).assignee is None


def test_task_update_assignee_too_long():
    with pytest.raises(ValidationError):
        TaskUpdate(assignee="B" * 101)


def test_task_update_rejects_invalid_enums():
    with pytest.raises(ValidationError):
        TaskUpdate(status="Archived")
    with pytest.raises(ValidationError):
        TaskUpdate(priority="Urgent")


def test_task_update_does_not_reject_past_due_date():
    # Aturan due_date pada update dicek di service (dibanding created_at), bukan di schema
    past = datetime(2000, 1, 1, tzinfo=timezone.utc)
    assert TaskUpdate(due_date=past).due_date == past


# ------------------------------------------------------------------------------
# Schema respons
# ------------------------------------------------------------------------------
def test_task_response_reads_from_orm_attributes():
    now = datetime.now(timezone.utc)
    orm_like = SimpleNamespace(
        id=7,
        title="Dari ORM",
        description=None,
        status=TaskStatus.IN_PROGRESS,
        priority=TaskPriority.HIGH,
        assignee="Budi",
        due_date=None,
        created_at=now,
        updated_at=now,
    )
    response = TaskResponse.model_validate(orm_like)
    assert response.id == 7
    assert response.model_dump(mode="json")["status"] == "In Progress"
    assert response.model_dump(mode="json")["priority"] == "High"


def test_task_response_requires_system_fields():
    with pytest.raises(ValidationError) as exc_info:
        TaskResponse(title="T", status="To Do", priority="Low")
    missing = {err["loc"][0] for err in exc_info.value.errors()}
    assert missing == {"id", "created_at", "updated_at"}


def test_task_list_response_structure():
    now = datetime.now(timezone.utc)
    item = {
        "id": 1,
        "title": "T",
        "status": "To Do",
        "priority": "Low",
        "created_at": now,
        "updated_at": now,
    }
    listing = TaskListResponse(items=[item], total=1, page=1, limit=10, total_pages=1)
    assert isinstance(listing.items[0], TaskResponse)
    assert listing.total_pages == 1


def test_task_summary_response_structure():
    summary = TaskSummaryResponse(
        total=3, todo=1, in_progress=1, done=1, overdue=0, by_status={"To Do": 1}
    )
    assert summary.by_status == {"To Do": 1}
    with pytest.raises(ValidationError):
        TaskSummaryResponse(total=3)


def test_audit_log_response_reads_from_orm_attributes():
    now = datetime.now(timezone.utc)
    initial = TaskAuditLogResponse.model_validate(
        SimpleNamespace(id=1, task_id=9, old_status=None, new_status=TaskStatus.TODO, changed_at=now)
    )
    assert initial.old_status is None
    assert initial.new_status is TaskStatus.TODO

    change = TaskAuditLogResponse.model_validate(
        SimpleNamespace(id=2, task_id=9, old_status="To Do", new_status="Done", changed_at=now)
    )
    assert change.model_dump(mode="json")["old_status"] == "To Do"
    assert change.model_dump(mode="json")["new_status"] == "Done"


def test_audit_log_response_requires_new_status():
    with pytest.raises(ValidationError):
        TaskAuditLogResponse(id=1, task_id=1, changed_at=datetime.now(timezone.utc))
