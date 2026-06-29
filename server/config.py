import os
import json

def get_config():
    mode = os.getenv("NODE_ENV", "development")  # Mode d'exécution (développement ou production)
    print(f"Mode d'exécution : {mode}")

    if mode in ["production", "testing"]:
        # Chargement de la configuration depuis l'environnement pour la production et les tests CI
       # En production, refuser de démarrer avec une clé secrète absente ou faible.
       _secret = os.getenv("SECRET_KEY", "" if mode == "production" else "testing-only-secret")
       if mode == "production" and (not _secret or len(_secret) < 32):
           raise RuntimeError(
               "SECRET_KEY manquante ou trop faible en production : "
               "définissez une variable d'environnement SECRET_KEY (>= 32 caractères, ex. `openssl rand -hex 32`)."
           )
       return {
            "MODE" : "production",
            #TOKEN
            "SECRET_KEY": _secret,  # Clé secrète pour JWT
            "ALGORITHM": os.getenv("ALGORITHM", "HS256"),  # Algorithme de cryptage
            "ACCESS_TOKEN_EXPIRE_MINUTES": int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)),  # Durée d'expiration du token d'accès
            "REFRESH_TOKEN_EXPIRE_DAYS": int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7)),  # Durée d'expiration du token de rafraîchissement
            #DATABASE
            "DATABASE_USER": os.getenv("DATABASE_USER", "admin"),  # Nom d'utilisateur de la base de données
            "DATABASE_PASSWORD": os.getenv("DATABASE_PASSWORD", "admin"),  # Mot de passe de la base de données
            "DATABASE_HOST": os.getenv("DATABASE_HOST", "127.0.0.1"),
            "DATABASE_PORT": os.getenv("DATABASE_PORT", "5432"),  # Port de la base de données
            "DATABASE_NAME": os.getenv("DATABASE_NAME", "kdo"),  # Nom de la base de données 
            #URL
            "URL_CONNECTION": os.getenv("URL_CONNECTION", ""),  # URL de connexion
        }
    else:
        # Chargement de la configuration depuis le fichier JSON pour le développement

        with open("dev/config.json") as config_file:
            config = json.load(config_file)
            return {
                "MODE" : mode,
                #TOKEN
                "SECRET_KEY": config.get("SECRET_KEY", "1234567890"),  # Clé secrète pour JWT
                "ALGORITHM": config.get("ALGORITHM", "HS256"),  # Algorithme de cryptage
                "ACCESS_TOKEN_EXPIRE_MINUTES": int(config.get("ACCESS_TOKEN_EXPIRE_MINUTES", 30)),  # Durée d'expiration du token d'accès
                "REFRESH_TOKEN_EXPIRE_DAYS": int(config.get("REFRESH_TOKEN_EXPIRE_DAYS", 7)),  # Durée d'expiration du token de rafraîchissement
                #DATABASE
                "DATABASE_USER": config.get("DATABASE_USER", "admin"),  # Nom d'utilisateur de la base de données
                "DATABASE_PASSWORD": config.get("DATABASE_PASSWORD", "admin"),  # Mot de passe de la base de données
                "DATABASE_HOST": config.get("DATABASE_HOST", "localhost"),
                "DATABASE_PORT": config.get("DATABASE_PORT", "5432"),  # Port de la base de données
                "DATABASE_NAME": config.get("DATABASE_NAME", "kdo"),  # Nom de la base de données 
                #URL
                "URL_CONNECTION": config.get("URL_CONNECTION", ""),  # URL de connexion
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