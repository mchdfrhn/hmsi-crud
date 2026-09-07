from datetime import datetime, timezone
import math
from typing import Optional, Tuple, List, Union, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.task import Task, TaskStatus, TaskPriority
from backend.app.schemas.task import TaskCreate, TaskUpdate


class CRUDTask:
    def get(self, db: Session, task_id: int) -> Optional[Task]:
        return db.query(Task).filter(Task.id == task_id).first()

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
        query = db.query(Task)

        if status:
            query = query.filter(Task.status == status)

        if priority:
            query = query.filter(Task.priority == priority)

        if assignee:
            query = query.filter(Task.assignee.ilike(f"%{assignee}%"))

        if search:
            query = query.filter(Task.title.ilike(f"%{search}%"))

        if is_overdue is True:
            now_utc = datetime.now(timezone.utc)
            query = query.filter(
                Task.status != TaskStatus.DONE,
                Task.due_date.isnot(None),
                Task.due_date < now_utc,
            )

        total = query.count()
        total_pages = math.ceil(total / limit) if total > 0 else 1

        if sort_by == "due_date":
            order_exp = Task.due_date.asc().nulls_last() if sort_order == "asc" else Task.due_date.desc().nulls_last()
        elif sort_by == "title":
            order_exp = Task.title.asc() if sort_order == "asc" else Task.title.desc()
        else:
            order_exp = Task.created_at.asc() if sort_order == "asc" else Task.created_at.desc()

        offset = (page - 1) * limit
        items = query.order_by(order_exp).offset(offset).limit(limit).all()

        return items, total, total_pages

    def create(self, db: Session, *, obj_in: TaskCreate) -> Task:
        db_obj = Task(
            title=obj_in.title,
            description=obj_in.description,
            status=obj_in.status,
            priority=obj_in.priority,
            assignee=obj_in.assignee,
            due_date=obj_in.due_date,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: Task,
        obj_in: Union[TaskUpdate, Dict[str, Any]],
    ) -> Task:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        if "due_date" in update_data and update_data["due_date"] is not None:
            new_due = update_data["due_date"]
            if new_due.tzinfo is None:
                new_due = new_due.replace(tzinfo=timezone.utc)
            created = db_obj.created_at
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            if new_due < created:
                raise ValueError("Tenggat waktu (due_date) tidak boleh lebih awal dari tanggal/waktu pembuatan tugas.")

        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, *, db_obj: Task) -> None:
        db.delete(db_obj)
        db.commit()

    def get_summary(self, db: Session) -> Dict[str, Any]:
        total = db.query(Task).count()
        todo = db.query(Task).filter(Task.status == TaskStatus.TODO).count()
        in_progress = db.query(Task).filter(Task.status == TaskStatus.IN_PROGRESS).count()
        done = db.query(Task).filter(Task.status == TaskStatus.DONE).count()

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


crud_task = CRUDTask()
task_service = crud_task
