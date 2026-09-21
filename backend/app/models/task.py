# ==============================================================================
# MODEL DATA TUGAS (task.py)
# ==============================================================================
# File ini mendefinisikan entitas utama sistem: 'Task' dan tipe data Enum terkait.
# Konsep penting yang diterapkan di sini:
# 1. Python Enum vs PostgreSQL Native Enum: Memastikan integritas data di level aplikasi & database.
# 2. Indexing Strategy: Kolom yang sering difilter/disortir (status, priority, title, assignee) diberi index=True.
# 3. Timezone-aware DateTime: Menyimpan waktu presisi UTC untuk konsistensi global.
# 4. ORM Relationship: Relasi satu-ke-banyak (one-to-many) ke tabel riwayat audit (TaskAuditLog).
# ==============================================================================

import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.core.database import Base


class TaskStatus(str, enum.Enum):
    """
    Enum untuk status pengerjaan tugas.
    Mewarisi `str` agar saat diserialisasi ke format JSON atau disimpan ke database,
    nilainya berupa representasi string yang manusiawi (human-readable).
    """
    TODO = "To Do"
    IN_PROGRESS = "In Progress"
    DONE = "Done"


class TaskPriority(str, enum.Enum):
    """
    Enum untuk tingkat prioritas tugas.
    Membantu pengguna membedakan urgensi pekerjaan.
    """
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class Task(Base):
    """
    Model ORM Task merepresentasikan tabel 'tasks' di PostgreSQL.
    Mewarisi Base (declarative_base) dari database.py.
    """
    __tablename__ = "tasks"

    # Primary Key: Integer auto-increment unik untuk setiap tugas.
    # index=True mempercepat pencarian spesifik berdasarkan ID (GET /tasks/{id}).
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Judul tugas: Wajib diisi (nullable=False), maksimal 100 karakter.
    # Diberi indeks untuk mempercepat pencarian kata kunci (ILIKE).
    title = Column(String(100), nullable=False, index=True)

    # Deskripsi detail: Tipe Text (tanpa batasan panjang kaku), boleh kosong (nullable=True).
    description = Column(Text, nullable=True)

    # Status tugas: Menggunakan Enum SQLAlchemy dengan nilai dari TaskStatus enum.
    # default menentukan nilai di level ORM Python, server_default menentukan DEFAULT di level DDL SQL.
    status = Column(
        SQLEnum(TaskStatus, values_callable=lambda obj: [e.value for e in obj], name="task_status"),
        nullable=False,
        default=TaskStatus.TODO,
        server_default=TaskStatus.TODO.value,
        index=True,
    )

    # Prioritas tugas: Menggunakan Enum SQLEnum dengan nilai dari TaskPriority.
    priority = Column(
        SQLEnum(TaskPriority, values_callable=lambda obj: [e.value for e in obj], name="task_priority"),
        nullable=False,
        default=TaskPriority.MEDIUM,
        server_default=TaskPriority.MEDIUM.value,
        index=True,
    )

    # Nama penanggung jawab: Maksimal 100 karakter, boleh null jika belum didelegasikan.
    assignee = Column(String(100), nullable=True, index=True)

    # Tenggat waktu (deadline): Menyimpan tanggal dan waktu lengkap dengan zona waktu.
    due_date = Column(DateTime(timezone=True), nullable=True)

    # Waktu pembuatan record: Otomatis diisi oleh fungsi database saat INSERT (func.now()).
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Waktu pembaruan record: Otomatis di-update oleh database saat terjadi UPDATE record (onupdate=func.now()).
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relasi Satu-ke-Banyak (One-to-Many) ke tabel TaskAuditLog:
    # - back_populates: Menghubungkan relasi dua arah dengan atribut 'task' di TaskAuditLog.
    # - cascade="all, delete-orphan": Jika sebuah Task dihapus, seluruh riwayat audit log-nya
    #   akan otomatis ikut terhapus dari database agar tidak meninggalkan data yatim piatu (orphan).
    # - order_by: Memastikan log selalu terurut dari perubahan terbaru saat diakses via ORM.
    audit_logs = relationship(
        "TaskAuditLog",
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="desc(TaskAuditLog.changed_at)",
    )


