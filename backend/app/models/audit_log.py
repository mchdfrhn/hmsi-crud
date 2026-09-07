from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.core.database import Base
from backend.app.models.task import TaskStatus


class TaskAuditLog(Base):
    __tablename__ = "task_audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(
        Integer,
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    old_status = Column(
        SQLEnum(TaskStatus, values_callable=lambda obj: [e.value for e in obj], name="task_status"),
        nullable=True,
    )
    new_status = Column(
        SQLEnum(TaskStatus, values_callable=lambda obj: [e.value for e in obj], name="task_status"),
        nullable=False,
    )
    changed_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    task = relationship("Task", back_populates="audit_logs")
