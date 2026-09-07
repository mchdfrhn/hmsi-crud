"""create_tasks_table

Revision ID: f20bfc105665
Revises: 
Create Date: 2026-09-07 08:44:53.559529

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f20bfc105665'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == 'postgresql'

    if is_postgres:
        task_status_enum = postgresql.ENUM('To Do', 'In Progress', 'Done', name='task_status', create_type=False)
        task_priority_enum = postgresql.ENUM('Low', 'Medium', 'High', name='task_priority', create_type=False)
        task_status_enum.create(bind, checkfirst=True)
        task_priority_enum.create(bind, checkfirst=True)
    else:
        task_status_enum = sa.Enum('To Do', 'In Progress', 'Done', name='task_status')
        task_priority_enum = sa.Enum('Low', 'Medium', 'High', name='task_priority')

    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', task_status_enum, server_default='To Do', nullable=False),
        sa.Column('priority', task_priority_enum, server_default='Medium', nullable=False),
        sa.Column('assignee', sa.String(length=100), nullable=True),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_id'), 'tasks', ['id'], unique=False)
    op.create_index(op.f('ix_tasks_title'), 'tasks', ['title'], unique=False)
    op.create_index(op.f('ix_tasks_status'), 'tasks', ['status'], unique=False)
    op.create_index(op.f('ix_tasks_priority'), 'tasks', ['priority'], unique=False)
    op.create_index(op.f('ix_tasks_assignee'), 'tasks', ['assignee'], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == 'postgresql'

    op.drop_index(op.f('ix_tasks_assignee'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_priority'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_status'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_title'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_id'), table_name='tasks')
    op.drop_table('tasks')

    if is_postgres:
        postgresql.ENUM('Low', 'Medium', 'High', name='task_priority').drop(bind, checkfirst=True)
        postgresql.ENUM('To Do', 'In Progress', 'Done', name='task_status').drop(bind, checkfirst=True)
