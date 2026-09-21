# ==============================================================================
# SKEMA PYDANTIC & VALIDASI DATA TUGAS (schemas/task.py)
# ==============================================================================
# Modul ini mengatur validasi data masuk (Request Body) dan format data keluar (Response DTO).
# Mengapa Pydantic v2 sangat krusial di FastAPI?
# 1. Automatic Serialization & Deserialization (JSON <-> Python Object).
# 2. Strict Type Safety: Memastikan tipe data tepat (string, int, datetime, enum).
# 3. Business Rule Validation: Mencegah data kotor masuk ke database (misal judul hanya spasi,
#    atau due_date di masa lalu saat pembuatan tugas baru).
# 4. Auto OpenAPI/Swagger Docs: Otomatis mendokumentasikan skema data di /docs.
# ==============================================================================

from datetime import datetime, timezone
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from backend.app.models.task import TaskStatus, TaskPriority


# ------------------------------------------------------------------------------
# 1. Base Schema (Field bersama yang digunakan untuk create dan response)
# ------------------------------------------------------------------------------
class TaskBase(BaseModel):
    """
    Atribut dasar yang dimiliki oleh sebuah tugas.
    Digunakan sebagai kelas induk untuk TaskCreate dan TaskResponse.
    """
    title: str = Field(
        ...,
        max_length=100,
        description="Judul tugas (wajib diisi, maksimal 100 karakter)"
    )
    description: Optional[str] = Field(
        None,
        description="Deskripsi rinci mengenai tugas yang harus dikerjakan (opsional)"
    )
    status: TaskStatus = Field(
        default=TaskStatus.TODO,
        description="Status pengerjaan tugas (To Do, In Progress, Done)"
    )
    priority: TaskPriority = Field(
        default=TaskPriority.MEDIUM,
        description="Tingkat prioritas tugas (Low, Medium, High)"
    )
    assignee: Optional[str] = Field(
        None,
        max_length=100,
        description="Nama orang atau divisi yang bertanggung jawab atas tugas ini"
    )
    due_date: Optional[datetime] = Field(
        None,
        description="Tenggat waktu batas akhir penyelesaian tugas (ISO-8601 string)"
    )

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        """
        Validator khusus untuk judul:
        1. Menghapus whitespace di awal dan akhir (strip).
        2. Memastikan judul bukan hanya berisi spasi kosong.
        3. Memeriksa kembali batasan 100 karakter setelah di-strip.
        """
        stripped = v.strip()
        if not stripped:
            raise ValueError("Judul tugas (title) tidak boleh kosong atau hanya berisi spasi.")
        if len(stripped) > 100:
            raise ValueError("Judul tugas (title) maksimal 100 karakter.")
        return stripped

    @field_validator("assignee")
    @classmethod
    def validate_assignee(cls, v: Optional[str]) -> Optional[str]:
        """
        Membersihkan whitespace pada nama assignee.
        Jika pengguna hanya mengetik spasi "   ", ubah menjadi None (NULL di DB).
        """
        if v is not None:
            stripped = v.strip()
            return stripped if stripped else None
        return None


# ------------------------------------------------------------------------------
# 2. Schema Pembuatan Tugas Baru (TaskCreate)
# ------------------------------------------------------------------------------
class TaskCreate(TaskBase):
    """
    Skema payload HTTP POST untuk membuat tugas baru.
    Mewarisi semua field dari TaskBase, ditambah aturan validasi bisnis tambahan.
    """
    @model_validator(mode="after")
    def validate_due_date(self) -> "TaskCreate":
        """
        Aturan Bisnis:
        Saat membuat tugas baru, tenggat waktu (due_date) TIDAK BOLEH berada di masa lalu
        (lebih awal dari waktu pembuatan).
        """
        if self.due_date is not None:
            now = datetime.now(timezone.utc)
            due = self.due_date
            # Pastikan timezone aware agar perbandingan dengan now (UTC) valid
            if due.tzinfo is None:
                due = due.replace(tzinfo=timezone.utc)
            # Berikan toleransi 60 detik untuk memperhitungkan latency jaringan antara client dan server
            if due < now.replace(second=0, microsecond=0):
                raise ValueError("Tenggat waktu (due_date) tidak boleh lebih awal dari tanggal/waktu pembuatan tugas.")
        return self


# ------------------------------------------------------------------------------
# 3. Schema Pembaruan Tugas (TaskUpdate)
# ------------------------------------------------------------------------------
class TaskUpdate(BaseModel):
    """
    Skema payload HTTP PUT / PATCH untuk memperbarui tugas.
    Seluruh field bersifat opsional (None) agar klien hanya mengirim atribut yang ingin diubah.
    """
    title: Optional[str] = Field(None, max_length=100, description="Judul baru tugas")
    description: Optional[str] = Field(None, description="Deskripsi baru tugas")
    status: Optional[TaskStatus] = Field(None, description="Status baru tugas")
    priority: Optional[TaskPriority] = Field(None, description="Prioritas baru tugas")
    assignee: Optional[str] = Field(None, max_length=100, description="Penanggung jawab baru")
    due_date: Optional[datetime] = Field(None, description="Tenggat waktu baru")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        """Jika judul disertakan dalam pembaruan, pastikan tidak kosong."""
        if v is not None:
            stripped = v.strip()
            if not stripped:
                raise ValueError("Judul tugas (title) tidak boleh kosong atau hanya berisi spasi.")
            if len(stripped) > 100:
                raise ValueError("Judul tugas (title) maksimal 100 karakter.")
            return stripped
        return v

    @field_validator("assignee")
    @classmethod
    def validate_assignee(cls, v: Optional[str]) -> Optional[str]:
        """Bersihkan whitespace assignee saat update."""
        if v is not None:
            stripped = v.strip()
            return stripped if stripped else None
        return None


# ------------------------------------------------------------------------------
# 4. Schema Respons Tunggal (TaskResponse)
# ------------------------------------------------------------------------------
class TaskResponse(BaseModel):
    """
    Representasi data tugas yang dikembalikan ke client.
    Menyertakan field internal sistem seperti ID, created_at, dan updated_at.
    """
    id: int
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # from_attributes=True memungkinkan Pydantic membaca atribut dari objek SQLAlchemy Task
    model_config = ConfigDict(from_attributes=True)


# ------------------------------------------------------------------------------
# 5. Schema Respons Koleksi Berpaginasi (TaskListResponse)
# ------------------------------------------------------------------------------
class TaskListResponse(BaseModel):
    """
    Struktur standar pagination untuk daftar tugas:
    - items: array tugas pada halaman saat ini
    - total: jumlah seluruh baris data yang cocok dengan filter
    - page: indeks halaman saat ini (1-based)
    - limit: kapasitas item per halaman
    - total_pages: jumlah total halaman yang tersedia
    """
    items: List[TaskResponse]
    total: int
    page: int
    limit: int
    total_pages: int


# ------------------------------------------------------------------------------
# 6. Schema Respons Ringkasan Dashboard (TaskSummaryResponse)
# ------------------------------------------------------------------------------
class TaskSummaryResponse(BaseModel):
    """
    Statistik agregat untuk kartu KPI di dashboard:
    - total: jumlah keseluruhan tugas
    - todo: tugas berstatus To Do
    - in_progress: tugas yang sedang dikerjakan
    - done: tugas yang sudah selesai
    - overdue: tugas belum selesai yang sudah melewati batas deadline
    - by_status: breakdown jumlah per nama status
    """
    total: int
    todo: int
    in_progress: int
    done: int
    overdue: int
    by_status: Dict[str, int]

