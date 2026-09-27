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
HEAD = "0002"


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
            "CREATE TABLE ideas (id INTEGER PRIMARY KEY, name VARCHAR NOT NULL, comment VARCHAR NOT NULL, "
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
