from datetime import datetime, timezone
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from backend.app.models.task import TaskStatus, TaskPriority


class TaskBase(BaseModel):
    title: str = Field(..., max_length=100, description="Judul tugas (wajib, max 100 karakter)")
    description: Optional[str] = Field(None, description="Deskripsi rinci tugas (opsional)")
    status: TaskStatus = Field(default=TaskStatus.TODO, description="Status tugas")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Prioritas tugas")
    assignee: Optional[str] = Field(None, max_length=100, description="Penanggung jawab tugas")
    due_date: Optional[datetime] = Field(None, description="Tenggat waktu target penyelesaian")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Judul tugas (title) tidak boleh kosong.")
        if len(stripped) > 100:
            raise ValueError("Judul tugas (title) maksimal 100 karakter.")
        return stripped

    @field_validator("assignee")
    @classmethod
    def validate_assignee(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            return stripped if stripped else None
        return None


class TaskCreate(TaskBase):
    @model_validator(mode="after")
    def validate_due_date(self) -> "TaskCreate":
        if self.due_date is not None:
            now = datetime.now(timezone.utc)
            due = self.due_date
            if due.tzinfo is None:
                due = due.replace(tzinfo=timezone.utc)
            # Berikan toleransi 60 detik untuk perbedaan latency request
            if due < now.replace(second=0, microsecond=0):
                raise ValueError("Tenggat waktu (due_date) tidak boleh lebih awal dari tanggal/waktu pembuatan tugas.")
        return self


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=100, description="Judul tugas")
    description: Optional[str] = Field(None, description="Deskripsi tugas")
    status: Optional[TaskStatus] = Field(None, description="Status tugas")
    priority: Optional[TaskPriority] = Field(None, description="Prioritas tugas")
    assignee: Optional[str] = Field(None, max_length=100, description="Penanggung jawab")
    due_date: Optional[datetime] = Field(None, description="Tenggat waktu")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            if not stripped:
                raise ValueError("Judul tugas (title) tidak boleh kosong.")
            if len(stripped) > 100:
                raise ValueError("Judul tugas (title) maksimal 100 karakter.")
            return stripped
        return v

    @field_validator("assignee")
    @classmethod
    def validate_assignee(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            return stripped if stripped else None
        return None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskListResponse(BaseModel):
    items: List[TaskResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class TaskSummaryResponse(BaseModel):
    total: int
    todo: int
    in_progress: int
    done: int
    overdue: int
    by_status: Dict[str, int]
