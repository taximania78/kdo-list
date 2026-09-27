import os

import pytest

import config


@pytest.fixture
def isolated_env(monkeypatch, tmp_path):
    """Environnement isolé (load_dotenv écrit dans os.environ) et racine de dépôt temporaire."""
    monkeypatch.setattr(os, "environ", dict(os.environ))
    monkeypatch.setattr(config, "ROOT_DIR", tmp_path)
    for key in ("NODE_ENV", "SECRET_KEY", "DATABASE_USER", "DATABASE_NAME", "DATABASE_HOST"):
        os.environ.pop(key, None)
    return tmp_path


def test_development_reads_environment_without_config_json(isolated_env):
    os.environ.update({"NODE_ENV": "development", "DATABASE_NAME": "kdo_dev", "DATABASE_HOST": "db.local"})

    cfg = config.get_config()

    assert cfg["MODE"] == "development"
    assert cfg["DATABASE_NAME"] == "kdo_dev"
    assert cfg["DATABASE_HOST"] == "db.local"


def test_development_loads_env_local_without_overriding_environment(isolated_env):
    (isolated_env / ".env.local").write_text("DATABASE_NAME=depuis_fichier\nDATABASE_USER=depuis_fichier\n")
    os.environ.update({"NODE_ENV": "development", "DATABASE_USER": "depuis_env"})

    cfg = config.get_config()

    assert cfg["DATABASE_NAME"] == "depuis_fichier"
    assert cfg["DATABASE_USER"] == "depuis_env"


def test_production_ignores_env_local(isolated_env):
    (isolated_env / ".env.local").write_text("DATABASE_NAME=depuis_fichier\n")
    os.environ.update({"NODE_ENV": "production", "SECRET_KEY": "x" * 32})

    cfg = config.get_config()

    assert cfg["MODE"] == "production"
    assert cfg["DATABASE_NAME"] == "kdo"


def test_production_refuses_weak_secret_key(isolated_env):
    os.environ.update({"NODE_ENV": "production", "SECRET_KEY": "trop-court"})

    with pytest.raises(RuntimeError):
        config.get_config()
