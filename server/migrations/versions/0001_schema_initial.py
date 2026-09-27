"""Schéma initial (tolérant : ne crée que les tables et index absents).

Revision ID: 0001
Revises:
Create Date: 2026-09-27
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Les bases créées avant Alembic (create_db.py + scripts migrate_*.py) ont déjà ces tables :
    # on ne crée que ce qui manque, sans toucher aux tables ni aux données existantes.
    existing = set(sa.inspect(op.get_bind()).get_table_names())

    if "app_settings" not in existing:
        op.create_table(
            "app_settings",
            sa.Column("key", sa.String(), nullable=False),
            sa.Column("value", sa.String(), nullable=False),
            sa.PrimaryKeyConstraint("key"),
        )

    if "users" not in existing:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("password", sa.String(), nullable=False),
            sa.Column("isAdmin", sa.Boolean(), nullable=False),
            sa.Column("isMegaAdmin", sa.Boolean(), nullable=False),
            sa.Column("firstConnection", sa.Boolean(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False, if_not_exists=True)
    op.create_index(op.f("ix_users_name"), "users", ["name"], unique=False, if_not_exists=True)

    if "gift_lists" not in existing:
        op.create_table(
            "gift_lists",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("slug", sa.String(), nullable=False),
            sa.Column("label", sa.String(), nullable=False),
            sa.Column("owner_id", sa.Integer(), nullable=True),
            sa.Column("is_common", sa.Boolean(), nullable=False),
            sa.Column("enabled", sa.Boolean(), nullable=False),
            sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("slug"),
        )
    op.create_index(op.f("ix_gift_lists_id"), "gift_lists", ["id"], unique=False, if_not_exists=True)

    if "refresh_tokens" not in existing:
        op.create_table(
            "refresh_tokens",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("refresh_token", sa.String(), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("refresh_token"),
        )
    op.create_index(op.f("ix_refresh_tokens_id"), "refresh_tokens", ["id"], unique=False, if_not_exists=True)

    if "ideas" not in existing:
        op.create_table(
            "ideas",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("comment", sa.String(), nullable=True),
            sa.Column("userId", sa.Integer(), nullable=True),
            sa.Column("list_id", sa.Integer(), nullable=True),
            sa.Column("availability", sa.Boolean(), nullable=False),
            sa.Column("takenById", sa.Integer(), nullable=True),
            sa.Column("price", sa.Float(), nullable=True),
            sa.Column("url", sa.String(), nullable=True),
            sa.Column("image", sa.String(), nullable=True),
            sa.Column("imageDisplay", sa.String(), nullable=False),
            sa.ForeignKeyConstraint(["list_id"], ["gift_lists.id"]),
            sa.ForeignKeyConstraint(["takenById"], ["users.id"]),
            sa.ForeignKeyConstraint(["userId"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    op.create_index(op.f("ix_ideas_id"), "ideas", ["id"], unique=False, if_not_exists=True)
    op.create_index(op.f("ix_ideas_name"), "ideas", ["name"], unique=False, if_not_exists=True)


def downgrade() -> None:
    # Jamais de DROP TABLE sur une base existante : cette migration est irréversible.
    raise RuntimeError("Migration initiale irréversible : restaurez une sauvegarde si besoin.")
