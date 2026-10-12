from datetime import datetime, timedelta, timezone

import pytest

from backend.app.models.audit_log import TaskAuditLog
from backend.app.models.task import Task, TaskStatus
from backend.tests.conftest import iso_in

VALIDATION_DETAIL = "Data masukan tidak valid."


def create(client, **payload) -> dict:
    payload.setdefault("title", "Tugas")
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def error_fields(response) -> list:
    return [err["field"] for err in response.json()["errors"]]


# ------------------------------------------------------------------------------
# POST /api/tasks
# ------------------------------------------------------------------------------
def test_create_with_only_title_applies_defaults(client):
    data = create(client, title="Minimal")
    assert data["title"] == "Minimal"
    assert data["description"] is None
    assert data["status"] == "To Do"
    assert data["priority"] == "Medium"
    assert data["assignee"] is None
    assert data["due_date"] is None
    assert set(data) == {
        "id", "title", "description", "status", "priority",
        "assignee", "due_date", "created_at", "updated_at",
    }


def test_create_trims_title_and_assignee(client):
    data = create(client, title="  Rapikan  ", assignee="  Budi ")
    assert data["title"] == "Rapikan"
    assert data["assignee"] == "Budi"


def test_create_blank_assignee_is_stored_as_null(client):
    assert create(client, assignee="    ")["assignee"] is None


@pytest.mark.parametrize("status", ["To Do", "In Progress", "Done"])
@pytest.mark.parametrize("priority", ["Low", "Medium", "High"])
def test_create_accepts_every_status_and_priority(client, status, priority):
    data = create(client, status=status, priority=priority)
    assert data["status"] == status
    assert data["priority"] == priority


def test_create_title_of_exactly_100_characters(client):
    assert len(create(client, title="A" * 100)["title"]) == 100


def test_create_is_persisted(client, db_session):
    data = create(client, title="Tersimpan")
    assert db_session.query(Task).filter(Task.id == data["id"]).one().title == "Tersimpan"


@pytest.mark.parametrize(
    "payload, field",
    [
        ({}, "title"),
        ({"title": None}, "title"),
        ({"title": ""}, "title"),
        ({"title": "   "}, "title"),
        ({"title": "A" * 101}, "title"),
        ({"title": 123}, "title"),
        ({"title": "T", "status": "Archived"}, "status"),
        ({"title": "T", "priority": "Urgent"}, "priority"),
        ({"title": "T", "assignee": "B" * 101}, "assignee"),
        ({"title": "T", "due_date": "bukan tanggal"}, "due_date"),
    ],
)
def test_create_validation_error_names_the_field(client, payload, field):
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == 422
    body = response.json()
    assert body["detail"] == VALIDATION_DETAIL
    assert error_fields(response) == [field]
    assert body["errors"][0]["message"]
    assert body["errors"][0]["type"]


def test_create_reports_every_invalid_field(client):
    response = client.post("/api/tasks", json={"title": "", "status": "X", "priority": "Y"})
    assert response.status_code == 422
    assert sorted(error_fields(response)) == ["priority", "status", "title"]


def test_create_past_due_date_message(client):
    response = client.post("/api/tasks", json={"title": "T", "due_date": iso_in(days=-2)})
    assert response.status_code == 422
    messages = " ".join(err["message"] for err in response.json()["errors"])
    assert "Tenggat waktu (due_date) tidak boleh lebih awal" in messages


def test_create_rejects_malformed_json(client):
    response = client.post(
        "/api/tasks", content="{bukan json", headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 422
    assert response.json()["detail"] == VALIDATION_DETAIL


def test_create_failure_does_not_persist_anything(client, db_session):
    client.post("/api/tasks", json={"title": ""})
    assert db_session.query(Task).count() == 0
    assert db_session.query(TaskAuditLog).count() == 0


# ------------------------------------------------------------------------------
# GET /api/tasks
# ------------------------------------------------------------------------------
def test_list_empty(client):
    response = client.get("/api/tasks")
    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "page": 1, "limit": 10, "total_pages": 1}


def test_list_default_pagination(client, make_task):
    for _ in range(11):
        make_task()
    data = client.get("/api/tasks").json()
    assert len(data["items"]) == 10
    assert data["total"] == 11
    assert data["page"] == 1
    assert data["limit"] == 10
    assert data["total_pages"] == 2


def test_list_last_page_and_beyond(client, make_task):
    for _ in range(5):
        make_task()

    last = client.get("/api/tasks", params={"page": 3, "limit": 2}).json()
    assert len(last["items"]) == 1
    assert last["total_pages"] == 3
    assert last["page"] == 3

    beyond = client.get("/api/tasks", params={"page": 9, "limit": 2}).json()
    assert beyond["items"] == []
    assert beyond["total"] == 5


@pytest.mark.parametrize("limit", [1, 100])
def test_list_limit_boundaries_accepted(client, limit):
    response = client.get("/api/tasks", params={"limit": limit})
    assert response.status_code == 200
    assert response.json()["limit"] == limit


@pytest.mark.parametrize(
    "params, field",
    [
        ({"page": 0}, "query -> page"),
        ({"page": -1}, "query -> page"),
        ({"page": "abc"}, "query -> page"),
        ({"limit": 0}, "query -> limit"),
        ({"limit": 101}, "query -> limit"),
        ({"limit": "banyak"}, "query -> limit"),
        ({"is_overdue": "mungkin"}, "query -> is_overdue"),
    ],
)
def test_list_rejects_invalid_query_params(client, params, field):
    response = client.get("/api/tasks", params=params)
    assert response.status_code == 422
    assert response.json()["detail"] == VALIDATION_DETAIL
    assert error_fields(response) == [field]


def test_list_filters_by_status_priority_assignee_search(client, make_task):
    make_task(title="Backend API", status="In Progress", priority="High", assignee="Budi Santoso")
    make_task(title="Frontend UI", status="To Do", priority="Medium", assignee="Budi Santoso")
    make_task(title="Testing", status="Done", priority="Low", assignee="Siti")

    def titles(**params):
        params.setdefault("sort_by", "title")
        params.setdefault("sort_order", "asc")
        return [item["title"] for item in client.get("/api/tasks", params=params).json()["items"]]

    assert titles(status="In Progress") == ["Backend API"]
    assert titles(priority="Low") == ["Testing"]
    assert titles(assignee="budi") == ["Backend API", "Frontend UI"]
    assert titles(search="front") == ["Frontend UI"]
    assert titles(assignee="budi", status="To Do") == ["Frontend UI"]
    assert titles(search="tidak ada") == []


def test_list_filtered_total_reflects_filter(client, make_task):
    for _ in range(3):
        make_task(status="Done")
    make_task(status="To Do")

    data = client.get("/api/tasks", params={"status": "Done", "limit": 2}).json()
    assert data["total"] == 3
    assert data["total_pages"] == 2
    assert len(data["items"]) == 2


def test_list_overdue_filter(client, make_task):
    past = datetime.now(timezone.utc) - timedelta(days=1)
    make_task(title="telat", due_date=past)
    make_task(title="selesai", due_date=past, status="Done")
    make_task(title="aman", due_date=datetime.now(timezone.utc) + timedelta(days=1))
    make_task(title="tanpa tenggat")

    overdue = client.get("/api/tasks", params={"is_overdue": "true"}).json()
    assert [item["title"] for item in overdue["items"]] == ["telat"]
    assert overdue["total"] == 1

    assert client.get("/api/tasks", params={"is_overdue": "false"}).json()["total"] == 4


@pytest.mark.parametrize(
    "params, expected",
    [
        ({"sort_by": "title", "sort_order": "asc"}, ["A", "B", "C"]),
        ({"sort_by": "title", "sort_order": "desc"}, ["C", "B", "A"]),
        ({"sort_by": "due_date", "sort_order": "asc"}, ["C", "A", "B"]),
        ({"sort_by": "due_date", "sort_order": "desc"}, ["A", "C", "B"]),
        ({"sort_by": "created_at", "sort_order": "asc"}, ["B", "C", "A"]),
        ({}, ["A", "C", "B"]),
        ({"sort_by": "tidak_dikenal"}, ["A", "C", "B"]),
    ],
)
def test_list_sorting(client, make_task, params, expected):
    base = datetime(2030, 1, 1, tzinfo=timezone.utc)
    make_task(title="A", created_at=base + timedelta(days=2), due_date=base + timedelta(days=20))
    make_task(title="B", created_at=base, due_date=None)
    make_task(title="C", created_at=base + timedelta(days=1), due_date=base + timedelta(days=10))

    items = client.get("/api/tasks", params=params).json()["items"]
    assert [item["title"] for item in items] == expected


# ------------------------------------------------------------------------------
# GET /api/tasks/{id}
# ------------------------------------------------------------------------------
def test_get_by_id(client, make_task):
    task = make_task(title="Detail", description="Isi", assignee="Budi", priority="High")
    response = client.get(f"/api/tasks/{task.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task.id
    assert data["title"] == "Detail"
    assert data["description"] == "Isi"
    assert data["assignee"] == "Budi"
    assert data["priority"] == "High"


def test_get_by_id_not_found_message(client):
    response = client.get("/api/tasks/424242")
    assert response.status_code == 404
    assert response.json() == {"detail": "Tugas dengan ID 424242 tidak ditemukan."}


@pytest.mark.parametrize("method", ["get", "put", "delete"])
def test_non_integer_id_is_rejected(client, method):
    kwargs = {"json": {}} if method == "put" else {}
    response = getattr(client, method)("/api/tasks/abc", **kwargs)
    assert response.status_code == 422
    assert error_fields(response) == ["path -> id"]


# ------------------------------------------------------------------------------
# PUT /api/tasks/{id}
# ------------------------------------------------------------------------------
def test_update_all_fields(client, make_task):
    task = make_task(title="Lama")
    due = iso_in(days=5)
    response = client.put(
        f"/api/tasks/{task.id}",
        json={
            "title": "  Baru ",
            "description": "Deskripsi baru",
            "status": "Done",
            "priority": "High",
            "assignee": " Siti ",
            "due_date": due,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task.id
    assert data["title"] == "Baru"
    assert data["description"] == "Deskripsi baru"
    assert data["status"] == "Done"
    assert data["priority"] == "High"
    assert data["assignee"] == "Siti"
    assert data["due_date"] is not None


def test_update_partial_keeps_other_fields(client, make_task):
    task = make_task(title="Tetap", description="Tetap juga", priority="Low", assignee="Budi")
    data = client.put(f"/api/tasks/{task.id}", json={"priority": "High"}).json()
    assert data["priority"] == "High"
    assert data["title"] == "Tetap"
    assert data["description"] == "Tetap juga"
    assert data["assignee"] == "Budi"


def test_update_empty_body_is_a_noop(client, make_task):
    task = make_task(title="Tetap", status="In Progress")
    response = client.put(f"/api/tasks/{task.id}", json={})
    assert response.status_code == 200
    assert response.json()["title"] == "Tetap"
    assert response.json()["status"] == "In Progress"


def test_update_unknown_fields_are_ignored(client, make_task):
    task = make_task(title="Tetap")
    response = client.put(f"/api/tasks/{task.id}", json={"id": 999, "created_at": "2000-01-01T00:00:00Z"})
    assert response.status_code == 200
    assert response.json()["id"] == task.id
    assert not response.json()["created_at"].startswith("2000")


def test_update_null_clears_optional_fields(client, make_task):
    task = make_task(
        description="isi", assignee="Budi", due_date=datetime.now(timezone.utc) + timedelta(days=1)
    )
    data = client.put(
        f"/api/tasks/{task.id}", json={"description": None, "assignee": None, "due_date": None}
    ).json()
    assert data["description"] is None
    assert data["assignee"] is None
    assert data["due_date"] is None


def test_update_blank_assignee_becomes_null(client, make_task):
    task = make_task(assignee="Budi")
    assert client.put(f"/api/tasks/{task.id}", json={"assignee": "   "}).json()["assignee"] is None


@pytest.mark.parametrize(
    "payload, field",
    [
        ({"title": ""}, "title"),
        ({"title": "   "}, "title"),
        ({"title": "A" * 101}, "title"),
        ({"status": "Archived"}, "status"),
        ({"priority": "Urgent"}, "priority"),
        ({"assignee": "B" * 101}, "assignee"),
        ({"due_date": "kemarin"}, "due_date"),
    ],
)
def test_update_validation_errors(client, make_task, payload, field):
    task = make_task(title="Asli")
    response = client.put(f"/api/tasks/{task.id}", json=payload)
    assert response.status_code == 422
    assert response.json()["detail"] == VALIDATION_DETAIL
    assert error_fields(response) == [field]
    assert client.get(f"/api/tasks/{task.id}").json()["title"] == "Asli"


@pytest.mark.parametrize("due_date", ["2000-01-01T00:00:00Z", "2000-01-01T00:00:00"])
def test_update_due_date_before_created_at_is_rejected(client, make_task, due_date):
    task = make_task(title="Asli")
    response = client.put(f"/api/tasks/{task.id}", json={"title": "Berubah", "due_date": due_date})
    assert response.status_code == 422
    # Aturan bisnis dari service: detail berupa string, tanpa daftar errors per-field
    assert response.json() == {
        "detail": "Tenggat waktu (due_date) tidak boleh lebih awal dari tanggal/waktu pembuatan tugas."
    }
    assert client.get(f"/api/tasks/{task.id}").json()["title"] == "Asli"


def test_update_not_found(client):
    response = client.put("/api/tasks/424242", json={"title": "Hantu"})
    assert response.status_code == 404
    assert response.json() == {"detail": "Tugas dengan ID 424242 tidak ditemukan."}


def test_update_validates_body_before_looking_up_task(client):
    assert client.put("/api/tasks/424242", json={"title": ""}).status_code == 422


@pytest.mark.xfail(
    strict=True,
    reason="BUG: TaskUpdate menerima null untuk kolom NOT NULL, service meneruskannya ke DB "
    "sehingga terjadi IntegrityError (HTTP 500) alih-alih 422.",
)
@pytest.mark.parametrize("field", ["title", "status", "priority"])
def test_update_null_on_required_column_should_be_422(client, make_task, field):
    task = make_task()
    response = client.put(f"/api/tasks/{task.id}", json={field: None})
    assert response.status_code == 422


def test_patch_is_not_supported(client, make_task):
    task = make_task()
    assert client.patch(f"/api/tasks/{task.id}", json={"title": "x"}).status_code == 405


# ------------------------------------------------------------------------------
# DELETE /api/tasks/{id}
# ------------------------------------------------------------------------------
def test_delete_response_body(client, make_task):
    task = make_task()
    task_id = task.id
    response = client.delete(f"/api/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json() == {"detail": f"Tugas dengan ID {task_id} berhasil dihapus.", "id": task_id}


def test_delete_removes_task_and_audit_logs_from_database(client, db_session):
    task_id = create(client)["id"]
    client.put(f"/api/tasks/{task_id}", json={"status": "Done"})
    assert db_session.query(TaskAuditLog).filter(TaskAuditLog.task_id == task_id).count() == 2

    assert client.delete(f"/api/tasks/{task_id}").status_code == 200

    assert db_session.query(Task).filter(Task.id == task_id).count() == 0
    assert db_session.query(TaskAuditLog).filter(TaskAuditLog.task_id == task_id).count() == 0


def test_delete_only_removes_the_target(client):
    keep = create(client, title="Simpan")["id"]
    remove = create(client, title="Hapus")["id"]

    client.delete(f"/api/tasks/{remove}")

    listing = client.get("/api/tasks").json()
    assert [item["id"] for item in listing["items"]] == [keep]
    assert len(client.get(f"/api/tasks/{keep}/audit-logs").json()) == 1


def test_delete_not_found(client):
    response = client.delete("/api/tasks/424242")
    assert response.status_code == 404
    assert response.json() == {"detail": "Tugas dengan ID 424242 tidak ditemukan."}


# ------------------------------------------------------------------------------
# GET /api/tasks/summary
# ------------------------------------------------------------------------------
def test_summary_empty(client):
    response = client.get("/api/tasks/summary")
    assert response.status_code == 200
    assert response.json() == {
        "total": 0,
        "todo": 0,
        "in_progress": 0,
        "done": 0,
        "overdue": 0,
        "by_status": {"To Do": 0, "In Progress": 0, "Done": 0},
    }


def test_summary_is_not_captured_by_id_route(client):
    # "/summary" harus cocok dengan route statis, bukan "/{id}" (yang akan menghasilkan 422)
    assert client.get("/api/tasks/summary").status_code == 200


def test_summary_exact_counts(client, make_task):
    past = datetime.now(timezone.utc) - timedelta(days=1)
    make_task(status="To Do")
    make_task(status="To Do", due_date=past)
    make_task(status="In Progress", due_date=past)
    make_task(status="Done", due_date=past)

    assert client.get("/api/tasks/summary").json() == {
        "total": 4,
        "todo": 2,
        "in_progress": 1,
        "done": 1,
        "overdue": 2,
        "by_status": {"To Do": 2, "In Progress": 1, "Done": 1},
    }


def test_summary_follows_mutations(client):
    task_id = create(client)["id"]
    assert client.get("/api/tasks/summary").json()["todo"] == 1

    client.put(f"/api/tasks/{task_id}", json={"status": "Done"})
    summary = client.get("/api/tasks/summary").json()
    assert (summary["todo"], summary["done"]) == (0, 1)

    client.delete(f"/api/tasks/{task_id}")
    assert client.get("/api/tasks/summary").json()["total"] == 0


def test_completing_an_overdue_task_clears_overdue(client, make_task):
    task = make_task(due_date=datetime.now(timezone.utc) - timedelta(days=1))
    assert client.get("/api/tasks/summary").json()["overdue"] == 1

    client.put(f"/api/tasks/{task.id}", json={"status": "Done"})
    assert client.get("/api/tasks/summary").json()["overdue"] == 0


# ------------------------------------------------------------------------------
# GET /api/tasks/{id}/audit-logs
# ------------------------------------------------------------------------------
@pytest.mark.parametrize("status", ["To Do", "In Progress", "Done"])
def test_audit_log_initial_entry_uses_creation_status(client, status):
    task_id = create(client, status=status)["id"]
    logs = client.get(f"/api/tasks/{task_id}/audit-logs").json()
    assert len(logs) == 1
    assert set(logs[0]) == {"id", "task_id", "old_status", "new_status", "changed_at"}
    assert logs[0]["task_id"] == task_id
    assert logs[0]["old_status"] is None
    assert logs[0]["new_status"] == status


def test_audit_log_ignores_same_status_update(client):
    task_id = create(client, status="In Progress")["id"]
    client.put(f"/api/tasks/{task_id}", json={"status": "In Progress", "title": "Ganti judul"})
    assert len(client.get(f"/api/tasks/{task_id}/audit-logs").json()) == 1


def test_audit_log_records_reopen(client):
    task_id = create(client, status="Done")["id"]
    client.put(f"/api/tasks/{task_id}", json={"status": "In Progress"})
    newest = client.get(f"/api/tasks/{task_id}/audit-logs").json()[0]
    assert (newest["old_status"], newest["new_status"]) == ("Done", "In Progress")


def test_audit_logs_are_scoped_per_task(client):
    first = create(client)["id"]
    second = create(client)["id"]
    client.put(f"/api/tasks/{second}", json={"status": "Done"})

    assert len(client.get(f"/api/tasks/{first}/audit-logs").json()) == 1
    second_logs = client.get(f"/api/tasks/{second}/audit-logs").json()
    assert len(second_logs) == 2
    assert {log["task_id"] for log in second_logs} == {second}


def test_audit_logs_not_found(client):
    response = client.get("/api/tasks/424242/audit-logs")
    assert response.status_code == 404
    assert response.json() == {"detail": "Tugas dengan ID 424242 tidak ditemukan."}


def test_rejected_update_does_not_write_audit_log(client, make_task, db_session):
    task = make_task(status=TaskStatus.TODO)
    response = client.put(
        f"/api/tasks/{task.id}", json={"status": "Done", "due_date": "2000-01-01T00:00:00Z"}
    )
    assert response.status_code == 422
    assert db_session.query(TaskAuditLog).count() == 0
    assert client.get(f"/api/tasks/{task.id}").json()["status"] == "To Do"
