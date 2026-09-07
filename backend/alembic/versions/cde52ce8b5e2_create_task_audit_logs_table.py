"""create_task_audit_logs_table

Revision ID: cde52ce8b5e2
Revises: f20bfc105665
Create Date: 2026-09-07 09:03:29.965481

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cde52ce8b5e2'
down_revision: Union[str, Sequence[str], None] = 'f20bfc105665'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    is_postgres = bind.dialect.name == 'postgresql'

    if is_postgres:
        from sqlalchemy.dialects import postgresql
        task_status_enum = postgresql.ENUM('To Do', 'In Progress', 'Done', name='task_status', create_type=False)
    else:
        task_status_enum = sa.Enum('To Do', 'In Progress', 'Done', name='task_status')

    op.create_table(
        'task_audit_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('old_status', task_status_enum, nullable=True),
        sa.Column('new_status', task_status_enum, nullable=False),
        sa.Column('changed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_task_audit_logs_id'), 'task_audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_task_audit_logs_task_id'), 'task_audit_logs', ['task_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_task_audit_logs_task_id'), table_name='task_audit_logs')
    op.drop_index(op.f('ix_task_audit_logs_id'), table_name='task_audit_logs')
    op.drop_table('task_audit_logs')
