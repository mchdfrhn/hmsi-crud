from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db
from backend.app.service.tasks import task_service as crud_task
from backend.app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskListResponse,
    TaskSummaryResponse,
)

router = APIRouter()


@router.get("/summary", response_model=TaskSummaryResponse, summary="Ringkasan Status Tugas")
def get_task_summary(
    db: Session = Depends(get_db),
):
    """
    Mengambil ringkasan jumlah tugas berdasarkan statusnya (To Do, In Progress, Done, dan Overdue).
    """
    return crud_task.get_summary(db=db)


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
    Membuat tugas (task) baru dengan validasi field wajib.
    """
    return crud_task.create(db=db, obj_in=task_in)


@router.get("", response_model=TaskListResponse, summary="Mengambil Daftar Tugas")
def read_tasks(
    page: int = Query(1, ge=1, description="Nomor halaman (mulai dari 1)"),
    limit: int = Query(10, ge=1, le=100, description="Jumlah item per halaman"),
    status: Optional[str] = Query(None, description="Filter berdasarkan status (To Do, In Progress, Done)"),
    priority: Optional[str] = Query(None, description="Filter berdasarkan prioritas (Low, Medium, High)"),
    assignee: Optional[str] = Query(None, description="Filter berdasarkan assignee"),
    search: Optional[str] = Query(None, description="Pencarian kata kunci pada judul tugas"),
    db: Session = Depends(get_db),
):
    """
    Mengambil daftar tugas dengan dukungan paginasi, pencarian judul, dan filter (status, prioritas, assignee).
    """
    items, total, total_pages = crud_task.get_multi(
        db=db,
        page=page,
        limit=limit,
        status=status,
        priority=priority,
        assignee=assignee,
        search=search,
    )
    return TaskListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.get("/{id}", response_model=TaskResponse, summary="Mengambil Detail Tugas")
def read_task_by_id(
    id: int,
    db: Session = Depends(get_db),
):
    """
    Mengambil detail spesifik dari sebuah tugas berdasarkan ID.
    Mengembalikan 404 Not Found jika tugas tidak ditemukan.
    """
    task = crud_task.get(db=db, task_id=id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tugas dengan ID {id} tidak ditemukan.",
        )
    return task


@router.put("/{id}", response_model=TaskResponse, summary="Memperbarui Tugas (Full Update)")
def update_task_put(
    id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
):
    """
    Memperbarui data tugas yang sudah ada secara keseluruhan.
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
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(err),
        )
    return updated_task


@router.patch("/{id}", response_model=TaskResponse, summary="Memperbarui Sebagian Tugas (Partial Update)")
def update_task_patch(
    id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
):
    """
    Memperbarui sebagian atribut data tugas yang sudah ada.
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
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(err),
        )
    return updated_task


@router.delete("/{id}", summary="Menghapus Tugas")
def delete_task(
    id: int,
    db: Session = Depends(get_db),
):
    """
    Menghapus tugas berdasarkan ID.
    Mengembalikan 404 Not Found jika ID tidak ada di sistem.
    """
    task = crud_task.get(db=db, task_id=id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tugas dengan ID {id} tidak ditemukan.",
        )
    crud_task.delete(db=db, db_obj=task)
    return {"detail": f"Tugas dengan ID {id} berhasil dihapus.", "id": id}
