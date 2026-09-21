# ==============================================================================
# SKEMA SERIALISASI AUDIT LOG (schemas/audit_log.py)
# ==============================================================================
# Skema Pydantic ini berfungsi sebagai Data Transfer Object (DTO) untuk
# mengubah objek model ORM SQLAlchemy (TaskAuditLog) menjadi representasi JSON
# yang aman dan sesuai kontrak API publik.
# ==============================================================================

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from backend.app.models.task import TaskStatus


class TaskAuditLogResponse(BaseModel):
    """
    Skema respons untuk satu rekaman riwayat audit perubahan status.
    """
    id: int
    task_id: int
    # old_status bisa bernilai None jika entri ini adalah inisialisasi awal saat task dibuat
    old_status: Optional[TaskStatus] = None
    new_status: TaskStatus
    changed_at: datetime

    # from_attributes = True (sebelumnya orm_mode = True di Pydantic v1)
    # Memungkinkan Pydantic membaca data langsung dari objek ORM SQLAlchemy (atribut Python),
    # bukan hanya dari dictionary Python.
    model_config = ConfigDict(from_attributes=True)

