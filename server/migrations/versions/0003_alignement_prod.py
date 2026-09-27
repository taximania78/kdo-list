"""Alignement de la prod sur les modèles : colonnes obligatoires et expires_at en date + heure.

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-27
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def _expires_at_is_date(bind) -> bool:
    """Vrai sur la prod d'origine (colonne DATE) ; faux sur une base créée par 0001."""
    columns = {c["name"]: c for c in sa.inspect(bind).get_columns("refresh_tokens")}
    return isinstance(columns["expires_at"]["type"], sa.Date)


def upgrade() -> None:
    bind = op.get_bind()
    convert_expires_at = _expires_at_is_date(bind)

    # Valeurs vides remplacées sans changer le comportement actuel :
    # vide = pas super admin, pas de changement de mot de passe forcé, liste masquée.
    op.execute('UPDATE users SET "isMegaAdmin" = false WHERE "isMegaAdmin" IS NULL')
    op.execute('UPDATE users SET "firstConnection" = false WHERE "firstConnection" IS NULL')
    op.execute("UPDATE gift_lists SET enabled = false WHERE enabled IS NULL")
    # Jetons sans expiration : anciens jetons, déjà refusés (claim type absente)
    op.execute("DELETE FROM refresh_tokens WHERE expires_at IS NULL")

    with op.batch_alter_table("users") as batch:
        batch.alter_column("isMegaAdmin", existing_type=sa.Boolean(), nullable=False)
        batch.alter_column("firstConnection", existing_type=sa.Boolean(), nullable=False)

    with op.batch_alter_table("gift_lists") as batch:
        batch.alter_column("enabled", existing_type=sa.Boolean(), nullable=False)

    if convert_expires_at and bind.dialect.name == "sqlite":
        # SQLite (tests) : un changement de type recopie la table avec un CAST qui abîme les dates ;
        # on passe par une colonne intermédiaire.
        op.add_column("refresh_tokens", sa.Column("expires_at_new", sa.DateTime(timezone=True)))
        op.execute("UPDATE refresh_tokens SET expires_at_new = datetime(expires_at, '+1 day')")
        with op.batch_alter_table("refresh_tokens") as batch:
            batch.drop_column("expires_at")
            batch.alter_column(
                "expires_at_new",
                new_column_name="expires_at",
                existing_type=sa.DateTime(timezone=True),
                nullable=False,
            )
    elif convert_expires_at:
        # PostgreSQL : une date devient « lendemain à minuit », aucun jeton n'est considéré expiré en avance
        op.alter_column(
            "refresh_tokens",
            "expires_at",
            existing_type=sa.Date(),
            type_=sa.DateTime(timezone=True),
            nullable=False,
            postgresql_using="(expires_at + 1)::timestamptz",
        )
    else:
        with op.batch_alter_table("refresh_tokens") as batch:
            batch.alter_column("expires_at", existing_type=sa.DateTime(timezone=True), nullable=False)


def downgrade() -> None:
    # Les colonnes redeviennent facultatives ; expires_at garde la date et l'heure.
    with op.batch_alter_table("refresh_tokens") as batch:
        batch.alter_column("expires_at", existing_type=sa.DateTime(timezone=True), nullable=True)
    with op.batch_alter_table("gift_lists") as batch:
        batch.alter_column("enabled", existing_type=sa.Boolean(), nullable=True)
    with op.batch_alter_table("users") as batch:
        batch.alter_column("firstConnection", existing_type=sa.Boolean(), nullable=True)
        batch.alter_column("isMegaAdmin", existing_type=sa.Boolean(), nullable=True)
