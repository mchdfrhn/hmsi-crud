# ==============================================================================
# MODEL AUDIT LOG TUGAS (audit_log.py)
# ==============================================================================
# File ini mendefinisikan model 'TaskAuditLog' untuk mencatat jejak audit (audit trail).
# Mengapa Audit Trail penting dalam aplikasi enterprise?
# 1. Akuntabilitas: Melacak kapan suatu status berubah dan apa status sebelumnya.
# 2. Transparansi: Pengguna dan manajer dapat melihat progres tugas secara kronologis.
# 3. Analisis Riwayat: Memungkinkan penghitungan durasi suatu tugas di status tertentu.
# ==============================================================================

from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.core.database import Base
from backend.app.models.task import TaskStatus


class TaskAuditLog(Base):
    """
    Model ORM TaskAuditLog merepresentasikan tabel 'task_audit_logs'.
    Setiap baris mencatat satu peristiwa perubahan status pada suatu tugas.
    """
    __tablename__ = "task_audit_logs"

    # Primary key unik untuk setiap entri log riwayat
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign Key yang merujuk ke tasks.id:
    # - ondelete="CASCADE": Menjaga integritas referensial di level PostgreSQL.
    #   Jika baris di tabel tasks dihapus, PostgreSQL otomatis menghapus log terkait.
    # - index=True: Mengoptimalkan performa query saat mengambil riwayat per task (WHERE task_id = ?).
    task_id = Column(
        Integer,
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Status sebelum perubahan terjadi.
    # Bernilai NULL (nullable=True) ketika tugas baru pertama kali dibuat (initial creation).
    old_status = Column(
        SQLEnum(TaskStatus, values_callable=lambda obj: [e.value for e in obj], name="task_status"),
        nullable=True,
    )

    # Status baru setelah perubahan dilakukan (wajib ada/nullable=False).
    new_status = Column(
        SQLEnum(TaskStatus, values_callable=lambda obj: [e.value for e in obj], name="task_status"),
        nullable=False,
    )

    # Waktu persis terjadinya perubahan status.
    # Default otomatis diambil dari jam server database (func.now()).
    changed_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relasi balik ke objek model Task (banyak-ke-satu / many-to-one).
    task = relationship("Task", back_populates="audit_logs")

