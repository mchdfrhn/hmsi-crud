from datetime import datetime, timezone, timedelta
from fastapi import status


def test_create_task_success(client):
    due = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    payload = {
        "title": "Setup PostgreSQL Database",
        "description": "Configure connection pool and schema",
        "priority": "High",
        "assignee": "Alice",
        "due_date": due,
    }
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["id"] is not None
    assert data["title"] == "Setup PostgreSQL Database"
    assert data["description"] == "Configure connection pool and schema"
    assert data["status"] == "To Do"  # Default status
    assert data["priority"] == "High"
    assert data["assignee"] == "Alice"
    assert data["created_at"] is not None
    assert data["updated_at"] is not None


def test_create_task_validation_errors(client):
    # 1. Empty title
    response = client.post("/api/tasks", json={"title": ""})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # 2. Whitespace-only title
    response = client.post("/api/tasks", json={"title": "    "})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # 3. Title too long (> 100 characters)
    response = client.post("/api/tasks", json={"title": "A" * 101})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # 4. Invalid status
    response = client.post("/api/tasks", json={"title": "Test Task", "status": "Archived"})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_task_due_date_past_error(client):
    past_due = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    payload = {
        "title": "Task with past due date",
        "due_date": past_due,
    }
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_read_tasks_pagination_and_filtering(client):
    # Buat beberapa data task
    tasks = [
        {"title": "Backend API FastAPI", "priority": "High", "status": "In Progress", "assignee": "Budi"},
        {"title": "Frontend NextJS UI", "priority": "Medium", "status": "To Do", "assignee": "Budi"},
        {"title": "Integration Testing", "priority": "Low", "status": "Done", "assignee": "Siti"},
    ]
    for t in tasks:
        client.post("/api/tasks", json=t)

    # 1. Pagination: limit 2
    res = client.get("/api/tasks?page=1&limit=2")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert len(data["items"]) == 2
    assert data["total"] >= 3
    assert data["page"] == 1
    assert data["limit"] == 2

    # 2. Filter Status
    res = client.get("/api/tasks?status=In Progress")
    assert res.status_code == status.HTTP_200_OK
    items = res.json()["items"]
    assert all(item["status"] == "In Progress" for item in items)

    # 3. Filter Priority
    res = client.get("/api/tasks?priority=High")
    assert res.status_code == status.HTTP_200_OK
    items = res.json()["items"]
    assert all(item["priority"] == "High" for item in items)

    # 4. Filter Assignee
    res = client.get("/api/tasks?assignee=Budi")
    assert res.status_code == status.HTTP_200_OK
    items = res.json()["items"]
    assert all(item["assignee"] == "Budi" for item in items)

    # 5. Search by Title
    res = client.get("/api/tasks?search=FastAPI")
    assert res.status_code == status.HTTP_200_OK
    items = res.json()["items"]
    assert len(items) >= 1
    assert "FastAPI" in items[0]["title"]


def test_read_task_by_id_success_and_not_found(client):
    # Buat task
    res = client.post("/api/tasks", json={"title": "Detail Task Test"})
    created_id = res.json()["id"]

    # Berhasil ambil ID
    res = client.get(f"/api/tasks/{created_id}")
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["id"] == created_id

    # 404 ID tidak ada
    res = client.get("/api/tasks/999999")
    assert res.status_code == status.HTTP_404_NOT_FOUND
    assert "tidak ditemukan" in res.json()["detail"]


def test_update_task_put(client):
    res = client.post("/api/tasks", json={"title": "Initial Task Title", "priority": "Low"})
    task_id = res.json()["id"]

    # PUT update status to In Progress
    put_status_res = client.put(f"/api/tasks/{task_id}", json={"status": "In Progress"})
    assert put_status_res.status_code == status.HTTP_200_OK
    assert put_status_res.json()["status"] == "In Progress"

    # PUT update title and priority
    future_due = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    put_res = client.put(
        f"/api/tasks/{task_id}",
        json={"title": "Updated Task Title", "priority": "High", "due_date": future_due},
    )
    assert put_res.status_code == status.HTTP_200_OK
    assert put_res.json()["title"] == "Updated Task Title"
    assert put_res.json()["priority"] == "High"

    # Update 404
    res_404 = client.put("/api/tasks/999999", json={"title": "Ghost"})
    assert res_404.status_code == status.HTTP_404_NOT_FOUND


def test_delete_task_success_and_not_found(client):
    res = client.post("/api/tasks", json={"title": "Task to be deleted"})
    task_id = res.json()["id"]

    # Hapus task
    del_res = client.delete(f"/api/tasks/{task_id}")
    assert del_res.status_code == status.HTTP_200_OK
    assert del_res.json()["id"] == task_id

    # Cek bahwa sudah tidak ada
    get_res = client.get(f"/api/tasks/{task_id}")
    assert get_res.status_code == status.HTTP_404_NOT_FOUND

    # Hapus kembali (404)
    del_again = client.delete(f"/api/tasks/{task_id}")
    assert del_again.status_code == status.HTTP_404_NOT_FOUND


def test_tasks_summary(client):
    # Buat berbagai task dengan status berbeda
    client.post("/api/tasks", json={"title": "Task 1", "status": "To Do"})
    client.post("/api/tasks", json={"title": "Task 2", "status": "In Progress"})
    client.post("/api/tasks", json={"title": "Task 3", "status": "Done"})

    res = client.get("/api/tasks/summary")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "total" in data
    assert "todo" in data
    assert "in_progress" in data
    assert "done" in data
    assert "overdue" in data
    assert "by_status" in data
    assert data["total"] >= 3


def test_task_audit_log_flow(client):
    # 1. Saat tugas dibuat, audit log awal tercatat dengan status awal (old_status=None, new_status="To Do")
    create_res = client.post("/api/tasks", json={"title": "Implement Audit Log Feature", "status": "To Do"})
    assert create_res.status_code == status.HTTP_201_CREATED
    task_id = create_res.json()["id"]

    logs_res = client.get(f"/api/tasks/{task_id}/audit-logs")
    assert logs_res.status_code == status.HTTP_200_OK
    logs = logs_res.json()
    assert len(logs) == 1
    assert logs[0]["task_id"] == task_id
    assert logs[0]["old_status"] is None
    assert logs[0]["new_status"] == "To Do"
    assert logs[0]["changed_at"] is not None

    # 2. Update field non-status (misal hanya title) TIDAK boleh menambah audit log status
    put_title_res = client.put(f"/api/tasks/{task_id}", json={"title": "Implement Audit Log Feature (Updated)"})
    assert put_title_res.status_code == status.HTTP_200_OK

    logs_res2 = client.get(f"/api/tasks/{task_id}/audit-logs")
    assert logs_res2.status_code == status.HTTP_200_OK
    assert len(logs_res2.json()) == 1

    # 3. Update status menjadi "In Progress" -> log baru tercatat (To Do -> In Progress)
    put_status_res1 = client.put(f"/api/tasks/{task_id}", json={"status": "In Progress"})
    assert put_status_res1.status_code == status.HTTP_200_OK

    logs_res3 = client.get(f"/api/tasks/{task_id}/audit-logs")
    logs3 = logs_res3.json()
    assert len(logs3) == 2
    # Hasil terurut desc (terbaru di depan)
    assert logs3[0]["old_status"] == "To Do"
    assert logs3[0]["new_status"] == "In Progress"
    assert logs3[1]["old_status"] is None
    assert logs3[1]["new_status"] == "To Do"

    # 4. Update status menjadi "Done" -> log ketiga tercatat (In Progress -> Done)
    put_status_res2 = client.put(f"/api/tasks/{task_id}", json={"status": "Done"})
    assert put_status_res2.status_code == status.HTTP_200_OK

    logs_res4 = client.get(f"/api/tasks/{task_id}/audit-logs")
    logs4 = logs_res4.json()
    assert len(logs4) == 3
    assert logs4[0]["old_status"] == "In Progress"
    assert logs4[0]["new_status"] == "Done"

    # 5. Endpoint audit logs mengembalikan 404 untuk task yang tidak ada
    not_found_res = client.get("/api/tasks/999999/audit-logs")
    assert not_found_res.status_code == status.HTTP_404_NOT_FOUND


def test_task_audit_log_cascade_delete(client):
    # Buat task dengan beberapa perubahan status
    res = client.post("/api/tasks", json={"title": "Task for Cascade Testing"})
    task_id = res.json()["id"]
    client.put(f"/api/tasks/{task_id}", json={"status": "In Progress"})

    # Pastikan log ada
    logs_res = client.get(f"/api/tasks/{task_id}/audit-logs")
    assert len(logs_res.json()) == 2

    # Hapus task
    del_res = client.delete(f"/api/tasks/{task_id}")
    assert del_res.status_code == status.HTTP_200_OK

    # Query audit logs harus 404 karena task telah terhapus
    assert client.get(f"/api/tasks/{task_id}/audit-logs").status_code == status.HTTP_404_NOT_FOUND

