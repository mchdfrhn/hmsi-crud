from datetime import datetime, timedelta, timezone

import pytest

from backend.app.models.audit_log import TaskAuditLog
from backend.app.models.task import Task, TaskPriority, TaskStatus
from backend.app.schemas.task import TaskCreate, TaskUpdate
from backend.app.service import CRUDTask, crud_task, task_service

PAST_DUE_MESSAGE = "Tenggat waktu (due_date) tidak boleh lebih awal"


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def titles(items) -> list:
    return [item.title for item in items]


def test_service_singletons():
    assert isinstance(crud_task, CRUDTask)
    assert task_service is crud_task


# ------------------------------------------------------------------------------
# get
# ------------------------------------------------------------------------------
def test_get_returns_task(db_session, make_task):
    task = make_task(title="Cari saya")
    assert crud_task.get(db_session, task.id).title == "Cari saya"


def test_get_returns_none_when_missing(db_session):
    assert crud_task.get(db_session, 999999) is None


# ------------------------------------------------------------------------------
# get_multi: paginasi
# ------------------------------------------------------------------------------
def test_get_multi_empty_database(db_session):
    items, total, total_pages = crud_task.get_multi(db_session)
    assert items == []
    assert total == 0
    # Minimal 1 halaman walaupun data kosong
    assert total_pages == 1


def test_get_multi_default_limit_is_ten(db_session, make_task):
    for _ in range(12):
        make_task()
    items, total, total_pages = crud_task.get_multi(db_session)
    assert len(items) == 10
    assert total == 12
    assert total_pages == 2


@pytest.mark.parametrize(
    "count, limit, expected_pages",
    [(1, 10, 1), (5, 5, 1), (6, 5, 2), (5, 2, 3), (3, 1, 3)],
)
def test_get_multi_total_pages(db_session, make_task, count, limit, expected_pages):
    for _ in range(count):
        make_task()
    _, total, total_pages = crud_task.get_multi(db_session, limit=limit)
    assert total == count
    assert total_pages == expected_pages


def test_get_multi_pages_do_not_overlap(db_session, make_task):
    for index in range(5):
        make_task(title=f"T{index}")
    seen = []
    for page, expected_len in [(1, 2), (2, 2), (3, 1)]:
        items, total, _ = crud_task.get_multi(
            db_session, page=page, limit=2, sort_by="title", sort_order="asc"
        )
        assert len(items) == expected_len
        assert total == 5
        seen.extend(titles(items))
    assert seen == ["T0", "T1", "T2", "T3", "T4"]


def test_get_multi_page_beyond_range_is_empty(db_session, make_task):
    make_task()
    items, total, total_pages = crud_task.get_multi(db_session, page=5, limit=10)
    assert items == []
    assert total == 1
    assert total_pages == 1


# ------------------------------------------------------------------------------
# get_multi: filter
# ------------------------------------------------------------------------------
@pytest.mark.parametrize("status", list(TaskStatus))
def test_get_multi_filters_by_status(db_session, make_task, status):
    for each in TaskStatus:
        make_task(title=each.value, status=each)
    # Filter menerima nilai string (dari query param) maupun anggota enum
    for value in (status, status.value):
        items, total, _ = crud_task.get_multi(db_session, status=value)
        assert total == 1
        assert items[0].status == status


@pytest.mark.parametrize("priority", list(TaskPriority))
def test_get_multi_filters_by_priority(db_session, make_task, priority):
    for each in TaskPriority:
        make_task(priority=each)
    items, total, _ = crud_task.get_multi(db_session, priority=priority.value)
    assert total == 1
    assert items[0].priority == priority


def test_get_multi_assignee_is_partial_and_case_insensitive(db_session, make_task):
    make_task(title="A", assignee="Budi Santoso")
    make_task(title="B", assignee="Siti Rahma")
    make_task(title="C", assignee=None)

    items, total, _ = crud_task.get_multi(db_session, assignee="budi")
    assert titles(items) == ["A"]
    assert total == 1
    assert crud_task.get_multi(db_session, assignee="SANTO")[1] == 1
    assert crud_task.get_multi(db_session, assignee="tidak ada")[1] == 0


def test_get_multi_search_is_partial_and_case_insensitive(db_session, make_task):
    make_task(title="Backend API FastAPI")
    make_task(title="Frontend NextJS UI")

    assert titles(crud_task.get_multi(db_session, search="fastapi")[0]) == ["Backend API FastAPI"]
    assert crud_task.get_multi(db_session, search="END")[1] == 2
    assert crud_task.get_multi(db_session, search="zzz")[1] == 0


def test_get_multi_search_only_matches_title(db_session, make_task):
    make_task(title="Judul", description="kata rahasia", assignee="rahasia")
    assert crud_task.get_multi(db_session, search="rahasia")[1] == 0


def test_get_multi_empty_string_filters_are_ignored(db_session, make_task):
    make_task()
    make_task(status=TaskStatus.DONE)
    _, total, _ = crud_task.get_multi(db_session, status="", priority="", assignee="", search="")
    assert total == 2


def test_get_multi_combines_filters_with_and(db_session, make_task):
    make_task(title="Target", status=TaskStatus.DONE, priority=TaskPriority.HIGH, assignee="Budi")
    make_task(title="Target lain", status=TaskStatus.DONE, priority=TaskPriority.LOW, assignee="Budi")
    make_task(title="Bukan", status=TaskStatus.TODO, priority=TaskPriority.HIGH, assignee="Budi")

    items, total, _ = crud_task.get_multi(
        db_session, status="Done", priority="High", assignee="budi", search="target"
    )
    assert titles(items) == ["Target"]
    assert total == 1


def test_get_multi_overdue_filter(db_session, make_task):
    past = now_utc() - timedelta(days=1)
    future = now_utc() + timedelta(days=1)
    make_task(title="telat todo", status=TaskStatus.TODO, due_date=past)
    make_task(title="telat progress", status=TaskStatus.IN_PROGRESS, due_date=past)
    make_task(title="selesai walau lewat", status=TaskStatus.DONE, due_date=past)
    make_task(title="belum jatuh tempo", due_date=future)
    make_task(title="tanpa tenggat", due_date=None)

    items, total, _ = crud_task.get_multi(db_session, is_overdue=True, sort_by="title", sort_order="asc")
    assert titles(items) == ["telat progress", "telat todo"]
    assert total == 2


@pytest.mark.parametrize("is_overdue", [False, None])
def test_get_multi_overdue_filter_inactive(db_session, make_task, is_overdue):
    make_task(due_date=now_utc() - timedelta(days=1))
    make_task(due_date=now_utc() + timedelta(days=1))
    assert crud_task.get_multi(db_session, is_overdue=is_overdue)[1] == 2


# ------------------------------------------------------------------------------
# get_multi: sorting
# ------------------------------------------------------------------------------
def test_get_multi_sorts_by_title(db_session, make_task):
    for title in ["Cemara", "Akasia", "Beringin"]:
        make_task(title=title)

    asc, _, _ = crud_task.get_multi(db_session, sort_by="title", sort_order="asc")
    desc, _, _ = crud_task.get_multi(db_session, sort_by="title", sort_order="desc")
    assert titles(asc) == ["Akasia", "Beringin", "Cemara"]
    assert titles(desc) == ["Cemara", "Beringin", "Akasia"]


def test_get_multi_sorts_by_due_date_with_nulls_last(db_session, make_task):
    base = now_utc()
    make_task(title="tanpa tenggat", due_date=None)
    make_task(title="lusa", due_date=base + timedelta(days=2))
    make_task(title="besok", due_date=base + timedelta(days=1))

    asc, _, _ = crud_task.get_multi(db_session, sort_by="due_date", sort_order="asc")
    desc, _, _ = crud_task.get_multi(db_session, sort_by="due_date", sort_order="desc")
    assert titles(asc) == ["besok", "lusa", "tanpa tenggat"]
    assert titles(desc) == ["lusa", "besok", "tanpa tenggat"]


def test_get_multi_sorts_by_created_at(db_session, make_task):
    base = datetime(2030, 1, 1, tzinfo=timezone.utc)
    make_task(title="tengah", created_at=base + timedelta(days=1))
    make_task(title="terbaru", created_at=base + timedelta(days=2))
    make_task(title="terlama", created_at=base)

    default, _, _ = crud_task.get_multi(db_session)
    asc, _, _ = crud_task.get_multi(db_session, sort_by="created_at", sort_order="asc")
    assert titles(default) == ["terbaru", "tengah", "terlama"]
    assert titles(asc) == ["terlama", "tengah", "terbaru"]


def test_get_multi_unknown_sort_falls_back_to_created_at_desc(db_session, make_task):
    base = datetime(2030, 1, 1, tzinfo=timezone.utc)
    make_task(title="Z lama", created_at=base)
    make_task(title="A baru", created_at=base + timedelta(days=1))

    for kwargs in ({"sort_by": "bogus"}, {"sort_by": None}, {"sort_order": "bogus"}, {"sort_order": None}):
        items, _, _ = crud_task.get_multi(db_session, **kwargs)
        assert titles(items) == ["A baru", "Z lama"], kwargs


# ------------------------------------------------------------------------------
# create
# ------------------------------------------------------------------------------
def test_create_persists_all_fields(db_session):
    due = now_utc() + timedelta(days=3)
    created = crud_task.create(
        db_session,
        obj_in=TaskCreate(
            title="Lengkap",
            description="Deskripsi",
            status="In Progress",
            priority="High",
            assignee="Budi",
            due_date=due,
        ),
    )

    stored = db_session.query(Task).filter(Task.id == created.id).one()
    assert stored.title == "Lengkap"
    assert stored.description == "Deskripsi"
    assert stored.status == TaskStatus.IN_PROGRESS
    assert stored.priority == TaskPriority.HIGH
    assert stored.assignee == "Budi"
    assert stored.due_date.replace(tzinfo=None) == due.replace(tzinfo=None)
    assert stored.created_at is not None
    assert stored.updated_at is not None


@pytest.mark.parametrize("status", list(TaskStatus))
def test_create_writes_initial_audit_log(db_session, status):
    created = crud_task.create(db_session, obj_in=TaskCreate(title="T", status=status))

    logs = db_session.query(TaskAuditLog).filter(TaskAuditLog.task_id == created.id).all()
    assert len(logs) == 1
    assert logs[0].old_status is None
    assert logs[0].new_status == status
    assert logs[0].changed_at is not None


def test_create_assigns_distinct_ids(db_session):
    first = crud_task.create(db_session, obj_in=TaskCreate(title="A"))
    second = crud_task.create(db_session, obj_in=TaskCreate(title="B"))
    assert first.id != second.id


# ------------------------------------------------------------------------------
# update
# ------------------------------------------------------------------------------
def test_update_only_changes_fields_that_were_sent(db_session, make_task):
    task = make_task(title="Lama", description="tetap", priority=TaskPriority.LOW, assignee="Budi")

    updated = crud_task.update(db_session, db_obj=task, obj_in=TaskUpdate(title="Baru"))

    assert updated.title == "Baru"
    assert updated.description == "tetap"
    assert updated.priority == TaskPriority.LOW
    assert updated.assignee == "Budi"


def test_update_accepts_plain_dict(db_session, make_task):
    task = make_task()
    updated = crud_task.update(
        db_session, db_obj=task, obj_in={"title": "Dari dict", "priority": TaskPriority.HIGH}
    )
    assert updated.title == "Dari dict"
    assert updated.priority == TaskPriority.HIGH


def test_update_ignores_unknown_dict_keys(db_session, make_task):
    task = make_task(title="Tetap")
    updated = crud_task.update(db_session, db_obj=task, obj_in={"tidak_ada": "x"})
    assert updated.title == "Tetap"
    assert not hasattr(updated, "tidak_ada")


def test_update_with_empty_payload_changes_nothing(db_session, make_task):
    task = make_task(title="Tetap", status=TaskStatus.IN_PROGRESS)
    updated = crud_task.update(db_session, db_obj=task, obj_in=TaskUpdate())
    assert updated.title == "Tetap"
    assert updated.status == TaskStatus.IN_PROGRESS
    assert db_session.query(TaskAuditLog).count() == 0


def test_update_can_clear_nullable_fields(db_session, make_task):
    task = make_task(description="isi", assignee="Budi", due_date=now_utc() + timedelta(days=1))
    updated = crud_task.update(
        db_session,
        db_obj=task,
        obj_in=TaskUpdate(description=None, assignee=None, due_date=None),
    )
    assert updated.description is None
    assert updated.assignee is None
    assert updated.due_date is None


def test_update_status_change_writes_audit_log(db_session, make_task):
    task = make_task(status=TaskStatus.TODO)

    crud_task.update(db_session, db_obj=task, obj_in=TaskUpdate(status="In Progress"))

    logs = db_session.query(TaskAuditLog).filter(TaskAuditLog.task_id == task.id).all()
    assert len(logs) == 1
    assert logs[0].old_status == TaskStatus.TODO
    assert logs[0].new_status == TaskStatus.IN_PROGRESS


def test_update_status_as_plain_string_writes_audit_log(db_session, make_task):
    task = make_task(status=TaskStatus.TODO)
    updated = crud_task.update(db_session, db_obj=task, obj_in={"status": "Done"})

    log = db_session.query(TaskAuditLog).filter(TaskAuditLog.task_id == task.id).one()
    assert updated.status == TaskStatus.DONE
    assert log.old_status == TaskStatus.TODO
    assert log.new_status == TaskStatus.DONE


@pytest.mark.parametrize("same_status", [TaskStatus.IN_PROGRESS, "In Progress"])
def test_update_same_status_does_not_write_audit_log(db_session, make_task, same_status):
    task = make_task(status=TaskStatus.IN_PROGRESS)
    crud_task.update(db_session, db_obj=task, obj_in={"status": same_status, "title": "Judul baru"})
    assert db_session.query(TaskAuditLog).count() == 0


def test_update_non_status_fields_do_not_write_audit_log(db_session, make_task):
    task = make_task()
    crud_task.update(db_session, db_obj=task, obj_in=TaskUpdate(title="x", priority="High", assignee="y"))
    assert db_session.query(TaskAuditLog).count() == 0


def test_update_records_each_status_transition(db_session, make_task):
    task = make_task(status=TaskStatus.TODO)
    for status in ("In Progress", "Done", "To Do"):
        crud_task.update(db_session, db_obj=task, obj_in=TaskUpdate(status=status))

    logs = db_session.query(TaskAuditLog).order_by(TaskAuditLog.id).all()
    assert [(log.old_status.value, log.new_status.value) for log in logs] == [
        ("To Do", "In Progress"),
        ("In Progress", "Done"),
        ("Done", "To Do"),
    ]


def test_update_rejects_due_date_before_created_at(db_session, make_task):
    created_at = datetime(2030, 6, 1, 12, 0, tzinfo=timezone.utc)
    task = make_task(title="Asli", created_at=created_at)

    with pytest.raises(ValueError, match="Tenggat waktu"):
        crud_task.update(
            db_session,
            db_obj=task,
            obj_in=TaskUpdate(title="Tidak boleh tersimpan", due_date=created_at - timedelta(seconds=1)),
        )

    # Validasi gagal sebelum ada perubahan yang diterapkan
    db_session.refresh(task)
    assert task.title == "Asli"
    assert task.due_date is None


def test_update_rejects_naive_due_date_before_created_at(db_session, make_task):
    task = make_task(created_at=datetime(2030, 6, 1, 12, 0, tzinfo=timezone.utc))
    with pytest.raises(ValueError) as exc_info:
        crud_task.update(db_session, db_obj=task, obj_in={"due_date": datetime(2030, 6, 1, 11, 59)})
    assert PAST_DUE_MESSAGE in str(exc_info.value)


def test_update_accepts_due_date_equal_or_after_created_at(db_session, make_task):
    created_at = datetime(2030, 6, 1, 12, 0, tzinfo=timezone.utc)
    task = make_task(created_at=created_at)

    crud_task.update(db_session, db_obj=task, obj_in={"due_date": created_at})
    assert task.due_date.replace(tzinfo=None) == created_at.replace(tzinfo=None)

    crud_task.update(db_session, db_obj=task, obj_in={"due_date": datetime(2030, 6, 2, 12, 0)})
    assert task.due_date.replace(tzinfo=None) == datetime(2030, 6, 2, 12, 0)


def test_update_allows_due_date_in_the_past_if_after_created_at(db_session, make_task):
    # Berbeda dengan create: pembanding saat update adalah created_at, bukan waktu sekarang
    created_at = now_utc() - timedelta(days=10)
    task = make_task(created_at=created_at)
    due = now_utc() - timedelta(days=5)

    updated = crud_task.update(db_session, db_obj=task, obj_in=TaskUpdate(due_date=due))
    assert updated.due_date.replace(tzinfo=None) == due.replace(tzinfo=None)


# ------------------------------------------------------------------------------
# get_audit_logs
# ------------------------------------------------------------------------------
def test_get_audit_logs_newest_first(db_session, make_task):
    task = make_task()
    base = datetime(2030, 1, 1, tzinfo=timezone.utc)
    for offset, status in enumerate([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]):
        db_session.add(
            TaskAuditLog(task_id=task.id, new_status=status, changed_at=base + timedelta(hours=offset))
        )
    db_session.commit()

    logs = crud_task.get_audit_logs(db_session, task.id)
    assert [log.new_status for log in logs] == [TaskStatus.DONE, TaskStatus.IN_PROGRESS, TaskStatus.TODO]


def test_get_audit_logs_breaks_timestamp_ties_by_id(db_session, make_task):
    task = make_task()
    same_time = datetime(2030, 1, 1, tzinfo=timezone.utc)
    for status in [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]:
        db_session.add(TaskAuditLog(task_id=task.id, new_status=status, changed_at=same_time))
    db_session.commit()

    logs = crud_task.get_audit_logs(db_session, task.id)
    assert [log.id for log in logs] == sorted((log.id for log in logs), reverse=True)
    assert logs[0].new_status == TaskStatus.DONE


def test_get_audit_logs_only_returns_logs_of_that_task(db_session):
    first = crud_task.create(db_session, obj_in=TaskCreate(title="A"))
    second = crud_task.create(db_session, obj_in=TaskCreate(title="B"))
    crud_task.update(db_session, db_obj=second, obj_in=TaskUpdate(status="Done"))

    assert len(crud_task.get_audit_logs(db_session, first.id)) == 1
    assert len(crud_task.get_audit_logs(db_session, second.id)) == 2
    assert {log.task_id for log in crud_task.get_audit_logs(db_session, second.id)} == {second.id}


def test_get_audit_logs_empty_for_unknown_task(db_session):
    assert crud_task.get_audit_logs(db_session, 999999) == []


# ------------------------------------------------------------------------------
# delete
# ------------------------------------------------------------------------------
def test_delete_removes_task_and_its_audit_logs(db_session):
    task = crud_task.create(db_session, obj_in=TaskCreate(title="Hapus"))
    crud_task.update(db_session, db_obj=task, obj_in=TaskUpdate(status="Done"))
    task_id = task.id

    assert crud_task.delete(db_session, db_obj=task) is None

    assert crud_task.get(db_session, task_id) is None
    assert db_session.query(TaskAuditLog).filter(TaskAuditLog.task_id == task_id).count() == 0


def test_delete_leaves_other_tasks_untouched(db_session):
    keep = crud_task.create(db_session, obj_in=TaskCreate(title="Simpan"))
    remove = crud_task.create(db_session, obj_in=TaskCreate(title="Hapus"))

    crud_task.delete(db_session, db_obj=remove)

    assert crud_task.get(db_session, keep.id) is not None
    assert len(crud_task.get_audit_logs(db_session, keep.id)) == 1


# ------------------------------------------------------------------------------
# get_summary
# ------------------------------------------------------------------------------
def test_get_summary_empty_database(db_session):
    assert crud_task.get_summary(db_session) == {
        "total": 0,
        "todo": 0,
        "in_progress": 0,
        "done": 0,
        "overdue": 0,
        "by_status": {"To Do": 0, "In Progress": 0, "Done": 0},
    }


def test_get_summary_counts_per_status(db_session, make_task):
    for status, count in [(TaskStatus.TODO, 3), (TaskStatus.IN_PROGRESS, 2), (TaskStatus.DONE, 1)]:
        for _ in range(count):
            make_task(status=status)

    summary = crud_task.get_summary(db_session)
    assert summary["total"] == 6
    assert summary["todo"] == 3
    assert summary["in_progress"] == 2
    assert summary["done"] == 1
    assert summary["overdue"] == 0
    assert summary["by_status"] == {"To Do": 3, "In Progress": 2, "Done": 1}
    assert sum(summary["by_status"].values()) == summary["total"]


def test_get_summary_overdue_rules(db_session, make_task):
    past = now_utc() - timedelta(hours=1)
    future = now_utc() + timedelta(hours=1)
    make_task(status=TaskStatus.TODO, due_date=past)  # overdue
    make_task(status=TaskStatus.IN_PROGRESS, due_date=past)  # overdue
    make_task(status=TaskStatus.DONE, due_date=past)  # sudah selesai -> bukan overdue
    make_task(status=TaskStatus.TODO, due_date=future)  # belum jatuh tempo
    make_task(status=TaskStatus.TODO, due_date=None)  # tanpa tenggat

    summary = crud_task.get_summary(db_session)
    assert summary["total"] == 5
    assert summary["overdue"] == 2


def test_get_summary_matches_overdue_filter(db_session, make_task):
    make_task(due_date=now_utc() - timedelta(days=2))
    make_task(due_date=now_utc() + timedelta(days=2))
    assert crud_task.get_summary(db_session)["overdue"] == crud_task.get_multi(db_session, is_overdue=True)[1]
