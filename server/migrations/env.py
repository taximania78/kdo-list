"""Environnement Alembic : base de config.py (ou sqlalchemy.url si fournie, ex. tests) et modèles de models.py."""
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import URL, Connection
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

import models  # noqa: F401 — enregistre les tables dans Base.metadata
from database import DATABASE_URL, Base

config = context.config

# Tests : pas de journalisation imposée quand configure_logger=False
if config.config_file_name is not None and config.attributes.get("configure_logger", True):
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _database_url() -> str | URL:
    return config.get_main_option("sqlalchemy.url") or DATABASE_URL


def run_migrations_offline() -> None:
    context.configure(
        url=_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = create_async_engine(_database_url(), poolclass=pool.NullPool)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
