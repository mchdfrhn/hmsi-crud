# ==============================================================================
# CONTROLLER ENDPOINT TUGAS (endpoints/tasks.py)
# ==============================================================================
# Modul ini mendefinisikan controller rute HTTP RESTful untuk entitas Task.
# Prinsip RESTful API yang diterapkan:
# - GET    /api/tasks/summary       : Mendapatkan statistik ringkasan dashboard (200 OK)
# - POST   /api/tasks               : Membuat tugas baru (201 Created)
# - GET    /api/tasks               : Mengambil daftar tugas dengan filter, pagination, & sort (200 OK)
# - GET    /api/tasks/{id}          : Mengambil detail satu tugas berdasarkan ID (200 OK / 404 Not Found)
# - GET    /api/tasks/{id}/audit-logs : Mengambil jejak audit perubahan status tugas (200 OK / 404 Not Found)
# - PUT    /api/tasks/{id}          : Memperbarui data tugas (200 OK / 404 Not Found / 422 Unprocessable)
# - DELETE /api/tasks/{id}          : Menghapus tugas dari sistem (200 OK / 404 Not Found)
# ==============================================================================

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db
from backend.app.schemas.audit_log import TaskAuditLogResponse
from backend.app.schemas.task import (
    TaskCreate,
    TaskListResponse,
    TaskResponse,
    TaskSummaryResponse,
    TaskUpdate,
)
from backend.app.service.tasks import task_service as crud_task

# Inisialisasi router lokal
router = APIRouter()


# ------------------------------------------------------------------------------
# 1. GET /api/tasks/summary (Ringkasan Dashboard)
# ------------------------------------------------------------------------------
# Catatan penting: Route statis seperti /summary HARUS didefinisikan SEBELUM route dinamis
# seperti /{id} agar FastAPI tidak mengira string "summary" sebagai parameter {id} bertipe integer!
@router.get(
    "/summary",
    response_model=TaskSummaryResponse,
    summary="Ringkasan Status Tugas",
)
def get_task_summary(
    db: Session = Depends(get_db),
):
    """
    Mengambil statistik agregasi jumlah tugas:
    - Total tugas keseluruhan
    - Tugas dengan status To Do, In Progress, Done
    - Tugas yang terlambat (Overdue)
    - Dictionary breakdown per status untuk visualisasi chart/progress bar
    """
    return crud_task.get_summary(db=db)


# ------------------------------------------------------------------------------
# 2. POST /api/tasks (Membuat Tugas Baru)
# ------------------------------------------------------------------------------
@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Membuat Tugas Baru",
)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
):
    """
    Membuat tugas baru:
    1. FastAPI otomatis memvalidasi JSON request body terhadap skema TaskCreate.
    2. Menyimpan data ke tabel tasks dan mencatat log inisial di task_audit_logs.
    3. Mengembalikan objek Task yang baru dibuat dengan HTTP status 201 Created.
    """
    return crud_task.create(db=db, obj_in=task_in)


# ------------------------------------------------------------------------------
# 3. GET /api/tasks (Mengambil Daftar Tugas Berpaginasi & Terfilter)
# ------------------------------------------------------------------------------
@router.get(
    "",
    response_model=TaskListResponse,
    summary="Mengambil Daftar Tugas",
)
def read_tasks(
    page: int = Query(1, ge=1, description="Nomor halaman (mulai dari 1)"),
    limit: int = Query(10, ge=1, le=100, description="Jumlah item per halaman (1 s/d 100)"),
    status: Optional[str] = Query(None, description="Filter status tugas (To Do, In Progress, Done)"),
    priority: Optional[str] = Query(None, description="Filter prioritas (Low, Medium, High)"),
    assignee: Optional[str] = Query(None, description="Filter parsial nama assignee"),
    search: Optional[str] = Query(None, description="Pencarian kata kunci pada judul tugas"),
    is_overdue: Optional[bool] = Query(None, description="Filter tugas yang melewati batas waktu"),
    sort_by: Optional[str] = Query("created_at", description="Kolom pengurutan: created_at, due_date, title"),
    sort_order: Optional[str] = Query("desc", description="Arah pengurutan: asc atau desc"),
    db: Session = Depends(get_db),
):
    """
    Mengambil daftar tugas dengan dukungan komprehensif:
    - Pagination: Menghindari beban memori dengan offset/limit di database.
    - Searching: Pencarian case-insensitive pada judul tugas.
    - Filtering: Berdasarkan status, prioritas, penanggung jawab, dan status keterlambatan (overdue).
    - Sorting: Mengurutkan data dinamis secara ascending atau descending.
    """
    items, total, total_pages = crud_task.get_multi(
        db=db,
        page=page,
        limit=limit,
        status=status,
        priority=priority,
        assignee=assignee,
        search=search,
        is_overdue=is_overdue,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return TaskListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


# ------------------------------------------------------------------------------
# 4. GET /api/tasks/{id} (Mengambil Detail Spesifik Satu Tugas)
# ------------------------------------------------------------------------------
@router.get(
    "/{id}",
    response_model=TaskResponse,
    summary="Mengambil Detail Tugas",
)
def read_task_by_id(
    id: int,
    db: Session = Depends(get_db),
):
    """
    Mengambil satu tugas spesifik berdasarkan ID uniknya.
    Jika ID tidak ditemukan di database, melemparkan HTTP 404 Not Found.
    """
    task = crud_task.get(db=db, task_id=id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tugas dengan ID {id} tidak ditemukan.",
        )
    return task


# ------------------------------------------------------------------------------
# 5. GET /api/tasks/{id}/audit-logs (Mengambil Riwayat Perubahan Status)
# ------------------------------------------------------------------------------
@router.get(
    "/{id}/audit-logs",
    response_model=List[TaskAuditLogResponse],
    summary="Mengambil Riwayat Audit Perubahan Status",
)
def read_task_audit_logs(
    id: int,
    db: Session = Depends(get_db),
):
    """
    Mengambil jejak audit (audit trail) untuk tugas tertentu.
    Memungkinkan melihat kapan status tugas berubah dari 'To Do' -> 'In Progress' -> 'Done'.
    """
    # Pastikan task valid dan ada di database terlebih dahulu
    task = crud_task.get(db=db, task_id=id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tugas dengan ID {id} tidak ditemukan.",
        )
    return crud_task.get_audit_logs(db=db, task_id=id)


# ------------------------------------------------------------------------------
# 6. PUT /api/tasks/{id} (Memperbarui Data Tugas)
# ------------------------------------------------------------------------------
@router.put(
    "/{id}",
    response_model=TaskResponse,
    summary="Memperbarui Tugas",
)
def update_task(
    id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
):
    """
    Memperbarui atribut tugas.
    Jika ada perubahan status, sistem secara otomatis menambahkan baris riwayat
    ke tabel task_audit_logs.
    """
    task = crud_task.get(db=db, task_id=id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tugas dengan ID {id} tidak ditemukan.",
        )
    try:
        updated_task = crud_task.update(db=db, db_obj=task, obj_in=task_in)
    except ValueError as err:
        # Menangkap validasi aturan bisnis (seperti due_date < created_at)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(err),
        )
    return updated_task


# ------------------------------------------------------------------------------
# 7. DELETE /api/tasks/{id} (Menghapus Tugas)
# ------------------------------------------------------------------------------
@router.delete(
    "/{id}",
    summary="Menghapus Tugas",
)
def delete_task(
    id: int,
    db: Session = Depends(get_db),
):
    """
    Menghapus record tugas berdasarkan ID.
    Relasi audit log terkait otomatis terhapus berkat cascade constraint.
    """
    task = crud_task.get(db=db, task_id=id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tugas dengan ID {id} tidak ditemukan.",
        )
    crud_task.delete(db=db, db_obj=task)
    return {"detail": f"Tugas dengan ID {id} berhasil dihapus.", "id": id}

