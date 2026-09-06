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


def test_update_task_put_and_patch(client):
    res = client.post("/api/tasks", json={"title": "Initial Task Title", "priority": "Low"})
    task_id = res.json()["id"]

    # PATCH status to In Progress
    patch_res = client.patch(f"/api/tasks/{task_id}", json={"status": "In Progress"})
    assert patch_res.status_code == status.HTTP_200_OK
    assert patch_res.json()["status"] == "In Progress"

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
    res_404 = client.patch("/api/tasks/999999", json={"title": "Ghost"})
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
