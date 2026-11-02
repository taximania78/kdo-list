"""Migrations Alembic : installation neuve, base existante (prod), idempotence, retour arrière bloqué."""
import sqlite3
from pathlib import Path

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import create_engine, text

import models  # noqa: F401 — enregistre les tables dans Base.metadata
from database import Base

ALEMBIC_INI = Path(__file__).parent / "alembic.ini"
HEAD = "0004"


def _alembic(db_path: Path) -> Config:
    cfg = Config(str(ALEMBIC_INI))
    cfg.set_main_option("sqlalchemy.url", f"sqlite+aiosqlite:///{db_path}")
    cfg.attributes["configure_logger"] = False  # ne pas écraser la journalisation de pytest
    return cfg


def _sync_engine(db_path: Path):
    return create_engine(f"sqlite:///{db_path}")


def _schema_diff(db_path: Path) -> list:
    with _sync_engine(db_path).connect() as conn:
        context = MigrationContext.configure(conn, opts={"compare_type": True})
        return compare_metadata(context, Base.metadata)


def _revision(db_path: Path) -> str:
    return sqlite3.connect(db_path).execute("SELECT version_num FROM alembic_version").fetchone()[0]


def _tables(db_path: Path) -> set[str]:
    rows = sqlite3.connect(db_path).execute("SELECT name FROM sqlite_master WHERE type = 'table'")
    return {name for (name,) in rows}


def test_upgrade_on_empty_database_matches_models(tmp_path):
    """Installation neuve : les migrations produisent exactement le schéma des modèles."""
    db = tmp_path / "neuve.db"
    command.upgrade(_alembic(db), "head")
    assert _schema_diff(db) == []
    assert _revision(db) == HEAD


def test_upgrade_on_existing_database_keeps_data(tmp_path):
    """Base créée avant Alembic (comme la prod) : aucune table recréée, données intactes."""
    db = tmp_path / "existante.db"
    engine = _sync_engine(db)
    Base.metadata.create_all(engine)
    with engine.begin() as conn:
        conn.execute(text(
            'INSERT INTO users (id, name, password, "isAdmin", "isMegaAdmin", "firstConnection") '
            "VALUES (1, 'paul', 'x', 0, 0, 0)"
        ))
        conn.execute(text(
            "INSERT INTO gift_lists (id, slug, label, owner_id, is_common, enabled) "
            "VALUES (1, 'paul', 'Liste de Paul', 1, 0, 1)"
        ))
        conn.execute(text(
            'INSERT INTO ideas (id, name, "userId", list_id, availability, "imageDisplay") '
            "VALUES (1, 'Vélo', 1, 1, 1, 'unknown.jpg')"
        ))

    command.upgrade(_alembic(db), "head")

    assert _revision(db) == HEAD
    con = sqlite3.connect(db)
    assert con.execute("SELECT name FROM users").fetchall() == [("paul",)]
    assert con.execute("SELECT label FROM gift_lists").fetchall() == [("Liste de Paul",)]
    assert con.execute("SELECT name FROM ideas").fetchall() == [("Vélo",)]
    assert _schema_diff(db) == []


def test_upgrade_is_idempotent(tmp_path):
    """Redémarrage du conteneur : un second upgrade ne fait rien et ne plante pas."""
    db = tmp_path / "redemarrage.db"
    command.upgrade(_alembic(db), "head")
    command.upgrade(_alembic(db), "head")
    assert _revision(db) == HEAD


def test_downgrade_of_initial_migration_is_blocked(tmp_path):
    """Un downgrade par erreur ne doit jamais supprimer les tables."""
    db = tmp_path / "downgrade.db"
    command.upgrade(_alembic(db), "head")
    with pytest.raises(RuntimeError):
        command.downgrade(_alembic(db), "base")
    assert {"users", "gift_lists", "ideas", "refresh_tokens", "app_settings"} <= _tables(db)


def test_upgrade_makes_idea_fields_optional_on_existing_database(tmp_path):
    """Base existante où commentaire/URL/image/prix sont NOT NULL : 0002 les rend facultatifs."""
    db = tmp_path / "not_null.db"
    engine = _sync_engine(db)
    Base.metadata.create_all(engine)
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE ideas"))
        conn.execute(text(
            "CREATE TABLE ideas (id INTEGER NOT NULL PRIMARY KEY, name VARCHAR NOT NULL, comment VARCHAR NOT NULL, "
            '"userId" INTEGER REFERENCES users(id), list_id INTEGER REFERENCES gift_lists(id), '
            'availability BOOLEAN NOT NULL, "takenById" INTEGER REFERENCES users(id), price FLOAT NOT NULL, '
            'url VARCHAR NOT NULL, image VARCHAR NOT NULL, "imageDisplay" VARCHAR NOT NULL)'
        ))
        conn.execute(text(
            'INSERT INTO ideas (id, name, comment, availability, price, url, image, "imageDisplay") '
            "VALUES (1, 'Vélo', 'rouge', 1, 10.0, 'http://x', '', 'unknown.jpg')"
        ))

    command.upgrade(_alembic(db), "head")

    not_null = {row[1]: row[3] for row in sqlite3.connect(db).execute("PRAGMA table_info(ideas)")}
    assert [not_null[c] for c in ("comment", "price", "url", "image")] == [0, 0, 0, 0]
    assert sqlite3.connect(db).execute("SELECT name, comment FROM ideas").fetchall() == [("Vélo", "rouge")]


# Structure réelle de la prod (\d du 2026-09-27), avant 0003
PRODUCTION_SCHEMA = [
    'CREATE TABLE users (id INTEGER NOT NULL PRIMARY KEY, name VARCHAR NOT NULL, password VARCHAR NOT NULL, '
    '"isAdmin" BOOLEAN NOT NULL, "isMegaAdmin" BOOLEAN, "firstConnection" BOOLEAN DEFAULT true)',
    "CREATE INDEX ix_users_id ON users (id)",
    "CREATE INDEX ix_users_name ON users (name)",
    "CREATE TABLE gift_lists (id INTEGER NOT NULL PRIMARY KEY, slug VARCHAR NOT NULL UNIQUE, label VARCHAR NOT NULL, "
    "enabled BOOLEAN DEFAULT true, owner_id INTEGER REFERENCES users(id), is_common BOOLEAN NOT NULL DEFAULT false)",
    "CREATE INDEX ix_gift_lists_id ON gift_lists (id)",
    'CREATE TABLE ideas (id INTEGER NOT NULL PRIMARY KEY, name VARCHAR NOT NULL, comment VARCHAR, "userId" INTEGER REFERENCES users(id), '
    'availability BOOLEAN NOT NULL, "takenById" INTEGER REFERENCES users(id), price FLOAT, url VARCHAR, image VARCHAR, '
    '"imageDisplay" VARCHAR NOT NULL, list_id INTEGER REFERENCES gift_lists(id))',
    "CREATE INDEX ix_ideas_id ON ideas (id)",
    "CREATE INDEX ix_ideas_name ON ideas (name)",
    "CREATE TABLE refresh_tokens (id INTEGER NOT NULL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), "
    "refresh_token VARCHAR NOT NULL UNIQUE, expires_at DATE)",
    "CREATE INDEX ix_refresh_tokens_id ON refresh_tokens (id)",
    "CREATE TABLE app_settings (key VARCHAR NOT NULL PRIMARY KEY, value VARCHAR NOT NULL)",
]


def test_upgrade_aligns_production_schema(tmp_path):
    """0003 aligne la prod sur les modèles sans changer le comportement des valeurs vides."""
    db = tmp_path / "prod.db"
    with _sync_engine(db).begin() as conn:
        for statement in PRODUCTION_SCHEMA:
            conn.execute(text(statement))
        conn.execute(text(
            'INSERT INTO users (id, name, password, "isAdmin", "isMegaAdmin", "firstConnection") '
            "VALUES (1, 'paul', 'x', 0, NULL, NULL)"
        ))
        conn.execute(text("INSERT INTO gift_lists (id, slug, label, enabled, is_common) VALUES (1, 'paul', 'Liste de Paul', NULL, 0)"))
        conn.execute(text(
            "INSERT INTO refresh_tokens (id, user_id, refresh_token, expires_at) "
            "VALUES (1, 1, 'avec-date', '2026-10-01'), (2, 1, 'sans-date', NULL)"
        ))

    command.upgrade(_alembic(db), "0003")

    con = sqlite3.connect(db)
    assert _revision(db) == "0003"
    assert con.execute('SELECT "isMegaAdmin", "firstConnection" FROM users').fetchall() == [(0, 0)]
    assert con.execute("SELECT enabled FROM gift_lists").fetchall() == [(0,)]
    tokens = con.execute("SELECT refresh_token, expires_at FROM refresh_tokens").fetchall()
    assert [t for t, _ in tokens] == ["avec-date"]
    assert tokens[0][1].startswith("2026-10-02 00:00:00")


def _columns(db_path: Path, table: str) -> set[str]:
    return {row[1] for row in sqlite3.connect(db_path).execute(f"PRAGMA table_info({table})")}


def _users_name_index_is_unique(db_path: Path) -> bool:
    rows = sqlite3.connect(db_path).execute("PRAGMA index_list(users)").fetchall()
    return [row[2] for row in rows if row[1] == "ix_users_name"] == [1]


def _db_at_0003(db: Path) -> None:
    command.upgrade(_alembic(db), "0003")


def test_upgrade_purges_plaintext_refresh_tokens(tmp_path):
    """0004 : les jetons en clair sont supprimés, la colonne devient token_hash."""
    db = tmp_path / "jetons.db"
    _db_at_0003(db)
    with _sync_engine(db).begin() as conn:
        conn.execute(text(
            'INSERT INTO users (id, name, password, "isAdmin", "isMegaAdmin", "firstConnection") '
            "VALUES (1, 'paul', 'x', 0, 0, 0)"
        ))
        conn.execute(text(
            "INSERT INTO refresh_tokens (id, user_id, refresh_token, expires_at) VALUES (1, 1, 'en-clair', '2030-01-01')"
        ))

    command.upgrade(_alembic(db), "head")

    assert sqlite3.connect(db).execute("SELECT COUNT(*) FROM refresh_tokens").fetchone() == (0,)
    columns = _columns(db, "refresh_tokens")
    assert "token_hash" in columns and "rotated_at" in columns
    assert "refresh_token" not in columns


def test_upgrade_refuses_duplicate_usernames(tmp_path):
    """0004 : deux comptes du même nom bloquent la migration, avec le nom dans le message."""
    db = tmp_path / "doublons.db"
    _db_at_0003(db)
    with _sync_engine(db).begin() as conn:
        for uid in (1, 2):
            conn.execute(text(
                'INSERT INTO users (id, name, password, "isAdmin", "isMegaAdmin", "firstConnection") '
                f"VALUES ({uid}, 'paul', 'x', 0, 0, 0)"
            ))

    with pytest.raises(RuntimeError, match="paul"):
        command.upgrade(_alembic(db), "head")


def test_downgrade_0004_restores_columns(tmp_path):
    """Retour de 0004 à 0003 : colonne refresh_token de retour, index des noms non unique."""
    db = tmp_path / "retour.db"
    command.upgrade(_alembic(db), "head")
    assert _users_name_index_is_unique(db)

    command.downgrade(_alembic(db), "0003")

    columns = _columns(db, "refresh_tokens")
    assert "refresh_token" in columns
    assert "token_hash" not in columns and "rotated_at" not in columns
    assert not _users_name_index_is_unique(db)
    assert _revision(db) == "0003"


def test_upgrade_production_schema_to_head_matches_models(tmp_path):
    """Prod d'origine jusqu'à 0004 : renommage sous batch, la contrainte unique survit sur token_hash."""
    db = tmp_path / "prod_head.db"
    with _sync_engine(db).begin() as conn:
        for statement in PRODUCTION_SCHEMA:
            conn.execute(text(statement))

    command.upgrade(_alembic(db), "head")

    assert _revision(db) == HEAD
    assert _schema_diff(db) == []
