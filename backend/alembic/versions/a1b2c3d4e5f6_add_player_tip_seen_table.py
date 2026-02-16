"""add player_tip_seen table

Revision ID: a1b2c3d4e5f6
Revises: 9a1b2c3d4e5f
Create Date: 2026-02-16 12:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9a1b2c3d4e5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'player_tip_seen',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('player_id', sa.Integer(), sa.ForeignKey('players.id'), nullable=False),
        sa.Column('tier_index', sa.Integer(), nullable=False),
        sa.Column('tip_id', sa.String(length=100), nullable=False),
        sa.Column('seen_at', sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('player_tip_seen')
