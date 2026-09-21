# ==============================================================================
# LAPISAN LAYANAN & LOGIKA BISNIS (service/tasks.py)
# ==============================================================================
# Modul ini mengimplementasikan pola Service / CRUD Repository.
# Manfaat memisahkan logic ini dari API endpoint (Controller):
# 1. Separation of Concerns: Controller hanya mengurus HTTP request/response,
#    sedangkan Service murni mengurus query database dan aturan bisnis.
# 2. Reusability: Fungsi CRUD dapat dipanggil dari berbagai tempat (API, background worker, CLI, dll).
# 3. Testability: Sangat mudah diuji dengan unit test menggunakan mock database session.
# ==============================================================================

from datetime import datetime, timezone
import math
from typing import Optional, Tuple, List, Union, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.task import Task, TaskStatus, TaskPriority
from backend.app.models.audit_log import TaskAuditLog
from backend.app.schemas.task import TaskCreate, TaskUpdate


class CRUDTask:
    """
    Kelas penyedia operasi Create, Read, Update, Delete, dan Agregasi untuk Task.
    """

    # --------------------------------------------------------------------------
    # 1. READ: Ambil satu tugas berdasarkan ID
    # --------------------------------------------------------------------------
    def get(self, db: Session, task_id: int) -> Optional[Task]:
        """
        Mencari satu record tugas berdasarkan primary key id.
        Mengembalikan instance Task jika ditemukan, atau None jika tidak ada.
        """
        return db.query(Task).filter(Task.id == task_id).first()

    # --------------------------------------------------------------------------
    # 2. READ MULTI: Ambil daftar tugas dengan filtering, sorting, & paginasi
    # --------------------------------------------------------------------------
    def get_multi(
        self,
        db: Session,
        *,
        page: int = 1,
        limit: int = 10,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assignee: Optional[str] = None,
        search: Optional[str] = None,
        is_overdue: Optional[bool] = None,
        sort_by: Optional[str] = "created_at",
        sort_order: Optional[str] = "desc",
    ) -> Tuple[List[Task], int, int]:
        """
        Membangun query dinamis berdasarkan parameter filter yang aktif:
        - status: memfilter status persis ("To Do", "In Progress", "Done")
        - priority: memfilter prioritas ("Low", "Medium", "High")
        - assignee: pencarian case-insensitive sebagian (ILIKE %nama%)
        - search: pencarian case-insensitive pada judul tugas (ILIKE %keyword%)
        - is_overdue: jika True, cari tugas yang statusnya BUKAN Done dan due_date < waktu sekarang UTC
        - sort_by: kolom pengurutan (created_at, due_date, title)
        - sort_order: arah pengurutan (asc, desc)
        Mengembalikan tuple: (daftar_item, total_data, total_halaman)
        """
        # Mulai dengan query dasar ke tabel tasks
        query = db.query(Task)

        # 1. Filter Status
        if status:
            query = query.filter(Task.status == status)

        # 2. Filter Priority
        if priority:
            query = query.filter(Task.priority == priority)

        # 3. Filter Assignee (ILIKE = Case-insensitive partial matching)
        if assignee:
            query = query.filter(Task.assignee.ilike(f"%{assignee}%"))

        # 4. Pencarian Judul (Search)
        if search:
            query = query.filter(Task.title.ilike(f"%{search}%"))

        # 5. Filter Tugas Terlambat (Overdue)
        if is_overdue is True:
            now_utc = datetime.now(timezone.utc)
            query = query.filter(
                Task.status != TaskStatus.DONE,
                Task.due_date.isnot(None),
                Task.due_date < now_utc,
            )

        # Hitung jumlah total data yang memenuhi kriteria filter SEBELUM pagination diaplikasikan
        total = query.count()
        total_pages = math.ceil(total / limit) if total > 0 else 1

        # 6. Menentukan Kolom dan Arah Pengurutan (Sorting)
        if sort_by == "due_date":
            # nulls_last() memastikan baris tanpa due_date selalu berada di posisi paling bawah
            order_exp = Task.due_date.asc().nulls_last() if sort_order == "asc" else Task.due_date.desc().nulls_last()
        elif sort_by == "title":
            order_exp = Task.title.asc() if sort_order == "asc" else Task.title.desc()
        else:
            # Default mengurutkan berdasarkan tanggal dibuat (created_at)
            order_exp = Task.created_at.asc() if sort_order == "asc" else Task.created_at.desc()

        # 7. Terapkan Limit dan Offset untuk Paginasi Database
        offset = (page - 1) * limit
        items = query.order_by(order_exp).offset(offset).limit(limit).all()

        return items, total, total_pages

    # --------------------------------------------------------------------------
    # 3. CREATE: Simpan tugas baru beserta log audit pertamanya
    # --------------------------------------------------------------------------
    def create(self, db: Session, *, obj_in: TaskCreate) -> Task:
        """
        Membuat record Task baru dan otomatis mencatat entry inisial di TaskAuditLog
        dalam 1 transaksi atomik database.
        """
        # 1. Konversi schema TaskCreate menjadi objek model ORM Task
        db_obj = Task(
            title=obj_in.title,
            description=obj_in.description,
            status=obj_in.status,
            priority=obj_in.priority,
            assignee=obj_in.assignee,
            due_date=obj_in.due_date,
        )
        db.add(db_obj)
        # flush() mengirim perubahan ke DB agar db_obj.id terisi tanpa commit transaksi final
        db.flush()

        # 2. Catat audit log perdana: old_status=None, new_status=status awal
        initial_log = TaskAuditLog(
            task_id=db_obj.id,
            old_status=None,
            new_status=db_obj.status,
        )
        db.add(initial_log)

        # 3. Commit seluruh transaksi sekaligus (Atomicity ACID)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    # --------------------------------------------------------------------------
    # 4. UPDATE: Perbarui data tugas dan deteksi perubahan status untuk audit log
    # --------------------------------------------------------------------------
    def update(
        self,
        db: Session,
        *,
        db_obj: Task,
        obj_in: Union[TaskUpdate, Dict[str, Any]],
    ) -> Task:
        """
        Memperbarui field yang dikirim saja (partial update).
        Jika kolom 'status' berubah, otomatis buat record baru di TaskAuditLog.
        """
        # Konversi input Pydantic atau Dict menjadi dictionary murni
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            # exclude_unset=True memastikan field yang tidak disertakan di JSON request diabaikan
            update_data = obj_in.model_dump(exclude_unset=True)

        # Validasi Aturan Bisnis: Jika due_date diperbarui, pastikan tidak sebelum created_at
        if "due_date" in update_data and update_data["due_date"] is not None:
            new_due = update_data["due_date"]
            if new_due.tzinfo is None:
                new_due = new_due.replace(tzinfo=timezone.utc)
            created = db_obj.created_at
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            if new_due < created:
                raise ValueError("Tenggat waktu (due_date) tidak boleh lebih awal dari tanggal/waktu pembuatan tugas.")

        # Deteksi apakah status mengalami perubahan nilai
        old_status = db_obj.status
        status_changed = False

        if "status" in update_data and update_data["status"] is not None:
            curr_val = old_status.value if hasattr(old_status, "value") else str(old_status)
            new_val = (
                update_data["status"].value
                if hasattr(update_data["status"], "value")
                else str(update_data["status"])
            )
            if curr_val != new_val:
                status_changed = True

        # Terapkan setiap nilai atribut baru ke objek model database
        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])

        db.add(db_obj)

        # Jika status memang berubah, tambahkan entri jejak riwayat audit baru
        if status_changed:
            audit_log = TaskAuditLog(
                task_id=db_obj.id,
                old_status=old_status,
                new_status=db_obj.status,
            )
            db.add(audit_log)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    # --------------------------------------------------------------------------
    # 5. READ AUDIT LOGS: Ambil jejak riwayat status tugas
    # --------------------------------------------------------------------------
    def get_audit_logs(self, db: Session, task_id: int) -> List[TaskAuditLog]:
        """
        Mengambil daftar audit log untuk suatu tugas, diurutkan dari yang terbaru ke terlama.
        """
        return (
            db.query(TaskAuditLog)
            .filter(TaskAuditLog.task_id == task_id)
            .order_by(TaskAuditLog.changed_at.desc(), TaskAuditLog.id.desc())
            .all()
        )

    # --------------------------------------------------------------------------
    # 6. DELETE: Hapus tugas dari database
    # --------------------------------------------------------------------------
    def delete(self, db: Session, *, db_obj: Task) -> None:
        """
        Menghapus record task. Berkat cascade="all, delete-orphan",
        semua riwayat audit log terkait di tabel task_audit_logs juga terhapus.
        """
        db.delete(db_obj)
        db.commit()

    # --------------------------------------------------------------------------
    # 7. AGGREGATE SUMMARY: Hitung metrik ringkasan untuk dashboard
    # --------------------------------------------------------------------------
    def get_summary(self, db: Session) -> Dict[str, Any]:
        """
        Menghitung statistik ringkasan menggunakan agregasi query:
        - Total tugas keseluruhan
        - Jumlah tugas per status (To Do, In Progress, Done)
        - Jumlah tugas terlambat (Overdue)
        """
        total = db.query(Task).count()
        todo = db.query(Task).filter(Task.status == TaskStatus.TODO).count()
        in_progress = db.query(Task).filter(Task.status == TaskStatus.IN_PROGRESS).count()
        done = db.query(Task).filter(Task.status == TaskStatus.DONE).count()

        # Tugas overdue: status belum selesai, punya deadline, dan deadline < saat ini
        now_utc = datetime.now(timezone.utc)
        overdue = (
            db.query(Task)
            .filter(
                Task.status != TaskStatus.DONE,
                Task.due_date.isnot(None),
                Task.due_date < now_utc,
            )
            .count()
        )

        return {
            "total": total,
            "todo": todo,
            "in_progress": in_progress,
            "done": done,
            "overdue": overdue,
            "by_status": {
                TaskStatus.TODO.value: todo,
                TaskStatus.IN_PROGRESS.value: in_progress,
                TaskStatus.DONE.value: done,
            },
        }


# Instansiasi objek singleton service
crud_task = CRUDTask()
task_service = crud_task

