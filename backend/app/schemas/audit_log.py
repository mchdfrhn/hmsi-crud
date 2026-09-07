from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from backend.app.models.task import TaskStatus


class TaskAuditLogResponse(BaseModel):
    id: int
    task_id: int
    old_status: Optional[TaskStatus] = None
    new_status: TaskStatus
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)
