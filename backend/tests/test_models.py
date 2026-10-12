from datetime import datetime, timedelta, timezone

from backend.app.models import Task, TaskAuditLog, TaskPriority, TaskStatus


def test_status_enum_values():
    assert [s.value for s in TaskStatus] == ["To Do", "In Progress", "Done"]
    # Mewarisi str agar langsung bisa dibandingkan / diserialisasi sebagai string
    assert TaskStatus.TODO == "To Do"
    assert TaskStatus("In Progress") is TaskStatus.IN_PROGRESS


def test_priority_enum_values():
    assert [p.value for p in TaskPriority] == ["Low", "Medium", "High"]
    assert TaskPriority.HIGH == "High"


def test_table_names():
    assert Task.__tablename__ == "tasks"
    assert TaskAuditLog.__tablename__ == "task_audit_logs"


def test_task_column_constraints():
    columns = Task.__table__.columns
    assert columns["title"].nullable is False
    assert columns["title"].type.length == 100
    assert columns["assignee"].type.length == 100
    assert columns["description"].nullable is True
    assert columns["due_date"].nullable is True
    assert columns["status"].nullable is False
    assert columns["priority"].nullable is False
    for indexed in ("id", "title", "status", "priority", "assignee"):
        assert columns[indexed].index is True


def test_audit_log_column_constraints():
    columns = TaskAuditLog.__table__.columns
    assert columns["old_status"].nullable is True
    assert columns["new_status"].nullable is False
    assert columns["task_id"].nullable is False
    foreign_key = next(iter(columns["task_id"].foreign_keys))
    assert foreign_key.target_fullname == "tasks.id"
    assert foreign_key.ondelete == "CASCADE"


def test_task_defaults_applied_on_insert(db_session):
    task = Task(title="Hanya judul")
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)

    assert task.id is not None
    assert task.status == TaskStatus.TODO
    assert task.priority == TaskPriority.MEDIUM
    assert task.description is None
    assert task.assignee is None
    assert task.due_date is None
    assert task.created_at is not None
    assert task.updated_at is not None
    assert task.audit_logs == []


def test_audit_logs_relationship_is_bidirectional_and_newest_first(db_session, make_task):
    task = make_task()
    base = datetime(2030, 1, 1, tzinfo=timezone.utc)
    older = TaskAuditLog(task_id=task.id, old_status=None, new_status=TaskStatus.TODO, changed_at=base)
    newer = TaskAuditLog(
        task_id=task.id,
        old_status=TaskStatus.TODO,
        new_status=TaskStatus.DONE,
        changed_at=base + timedelta(hours=1),
    )
    db_session.add_all([older, newer])
    db_session.commit()
    db_session.refresh(task)

    assert [log.new_status for log in task.audit_logs] == [TaskStatus.DONE, TaskStatus.TODO]
    assert newer.task is task


def test_deleting_task_cascades_to_audit_logs(db_session, make_task):
    task = make_task()
    db_session.add(TaskAuditLog(task_id=task.id, old_status=None, new_status=TaskStatus.TODO))
    db_session.commit()
    task_id = task.id

    db_session.delete(task)
    db_session.commit()

    assert db_session.query(TaskAuditLog).filter(TaskAuditLog.task_id == task_id).count() == 0


def test_removing_log_from_collection_deletes_orphan(db_session, make_task):
    task = make_task()
    db_session.add(TaskAuditLog(task_id=task.id, old_status=None, new_status=TaskStatus.TODO))
    db_session.commit()
    db_session.refresh(task)

    task.audit_logs.clear()
    db_session.commit()

    assert db_session.query(TaskAuditLog).count() == 0
