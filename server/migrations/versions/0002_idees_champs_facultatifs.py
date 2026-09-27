"""Idées : commentaire, URL, image et prix facultatifs.

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-27
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

COLUMNS = (("comment", sa.String()), ("price", sa.Float()), ("url", sa.String()), ("image", sa.String()))


def upgrade() -> None:
    # Sans effet si les colonnes sont déjà facultatives ; ne modifie aucune donnée.
    with op.batch_alter_table("ideas") as batch:
        for name, type_ in COLUMNS:
            batch.alter_column(name, existing_type=type_, nullable=True)


def downgrade() -> None:
    with op.batch_alter_table("ideas") as batch:
        for name, type_ in COLUMNS:
            batch.alter_column(name, existing_type=type_, nullable=False)
