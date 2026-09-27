import os
from pathlib import Path

from dotenv import load_dotenv

# Racine du dépôt : c'est là que le README fait créer .env.local
ROOT_DIR = Path(__file__).resolve().parent.parent

SERVER_MODES = ("production", "testing")  # configuration fournie par l'environnement (Docker, CI)


def load_dev_env_files() -> None:
    """Hors production/tests, charge .env.local puis .env à la racine du dépôt, sans écraser l'environnement."""
    for name in (".env.local", ".env"):
        load_dotenv(ROOT_DIR / name, override=False)


def get_config():
    if os.getenv("NODE_ENV", "development") not in SERVER_MODES:
        load_dev_env_files()
    mode = os.getenv("NODE_ENV", "development")  # Mode d'exécution (développement ou production)
    print(f"Mode d'exécution : {mode}")

    if mode == "production":
        # En production, refuser de démarrer avec une clé secrète absente ou faible.
        secret = os.getenv("SECRET_KEY", "")
        if len(secret) < 32:
            raise RuntimeError(
                "SECRET_KEY manquante ou trop faible en production : "
                "définissez une variable d'environnement SECRET_KEY (>= 32 caractères, ex. `openssl rand -hex 32`)."
            )
    elif mode == "testing":
        secret = os.getenv("SECRET_KEY", "testing-only-secret")
    else:
        secret = os.getenv("SECRET_KEY", "dev-only-secret")

    return {
        "MODE": "production" if mode in SERVER_MODES else mode,
        #TOKEN
        "SECRET_KEY": secret,  # Clé secrète pour JWT
        "ALGORITHM": os.getenv("ALGORITHM", "HS256"),  # Algorithme de cryptage
        "ACCESS_TOKEN_EXPIRE_MINUTES": int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)),  # Durée d'expiration du token d'accès
        "REFRESH_TOKEN_EXPIRE_DAYS": int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7)),  # Durée d'expiration du token de rafraîchissement
        #DATABASE
        "DATABASE_USER": os.getenv("DATABASE_USER", "admin"),  # Nom d'utilisateur de la base de données
        "DATABASE_PASSWORD": os.getenv("DATABASE_PASSWORD", "admin"),  # Mot de passe de la base de données
        "DATABASE_HOST": os.getenv("DATABASE_HOST", "localhost"),
        "DATABASE_PORT": os.getenv("DATABASE_PORT", "5432"),  # Port de la base de données
        "DATABASE_NAME": os.getenv("DATABASE_NAME", "kdo"),  # Nom de la base de données
        #URL
        "URL_CONNECTION": os.getenv("URL_CONNECTION", ""),  # URL de connexion
    }

config = get_config()

MODE = config["MODE"]  # Mode d'exécution (développement ou production)
SECRET_KEY = config["SECRET_KEY"]  # Clé secrète pour JWT
ALGORITHM = config["ALGORITHM"]  # Algorithme de cryptage
ACCESS_TOKEN_EXPIRE_MINUTES = config["ACCESS_TOKEN_EXPIRE_MINUTES"]  # Expiration du token JWT
REFRESH_TOKEN_EXPIRE_DAYS = config["REFRESH_TOKEN_EXPIRE_DAYS"]  # Expiration du Refresh Token

DATABASE_USER = config["DATABASE_USER"]  # Nom d'utilisateur de la base de données
DATABASE_PASSWORD = config["DATABASE_PASSWORD"]  # Mot de passe de la base de données
DATABASE_HOST = config["DATABASE_HOST"]  # Hôte de la base de données
DATABASE_PORT = config["DATABASE_PORT"]  # Port de la base de données
DATABASE_NAME = config["DATABASE_NAME"]  # Nom de la base de données

URL_CONNECTION = config["URL_CONNECTION"]  # URL de connexion
