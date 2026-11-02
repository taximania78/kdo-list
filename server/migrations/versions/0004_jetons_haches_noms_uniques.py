"""Jetons de rafraîchissement hachés (colonne token_hash, rotated_at) et noms d'utilisateur uniques.

Revision ID: 0004
Revises: 0003
Create Date: 2026-11-02
"""
from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def _columns(bind, table: str) -> set[str]:
    return {c["name"] for c in sa.inspect(bind).get_columns(table)}


def upgrade() -> None:
    bind = op.get_bind()

    doublons = [row[0] for row in bind.execute(sa.text("SELECT name FROM users GROUP BY name HAVING COUNT(*) > 1"))]
    if doublons:
        raise RuntimeError("Noms d'utilisateur en double, à renommer avant migration : " + ", ".join(doublons))

    # Les jetons en clair ne sont pas convertibles : tout le monde se reconnecte une fois.
    op.execute("DELETE FROM refresh_tokens")
    columns = _columns(bind, "refresh_tokens")
    # Base créée directement depuis les modèles (déjà à jour) : rien à renommer ni à ajouter.
    if "refresh_token" in columns:
        with op.batch_alter_table("refresh_tokens") as batch:
            batch.alter_column("refresh_token", new_column_name="token_hash", existing_type=sa.String(), existing_nullable=False)
    if "rotated_at" not in columns:
        with op.batch_alter_table("refresh_tokens") as batch:
            batch.add_column(sa.Column("rotated_at", sa.DateTime(timezone=True), nullable=True))

    op.drop_index(op.f("ix_users_name"), table_name="users", if_exists=True)
    op.create_index(op.f("ix_users_name"), "users", ["name"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_name"), table_name="users", if_exists=True)
    op.create_index(op.f("ix_users_name"), "users", ["name"], unique=False)

    # Les empreintes ne redonnent pas les jetons : purge, tout le monde se reconnecte.
    op.execute("DELETE FROM refresh_tokens")
    with op.batch_alter_table("refresh_tokens") as batch:
        batch.drop_column("rotated_at")
        batch.alter_column("token_hash", new_column_name="refresh_token", existing_type=sa.String(), existing_nullable=False)
