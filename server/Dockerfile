# Dockerfile for FastAPI application
FROM python:3.13-slim-trixie

# Applique les correctifs de sécurité Debian publiés après la construction de
# l'image de base (ex. zlib1g 1+deb13u1). Exécuté en root, avant USER appuser.
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup appuser

# Copy the requirements file and install dependencies
COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt \
    && python -m pip check \
    && python -m pip uninstall --yes pip

# Copy the application code
COPY --chown=appuser:appgroup . .

# Passer à l'utilisateur non-root
USER appuser

# Expose the port the app runs on
EXPOSE 8000

# Applique les migrations manquantes, puis démarre l'API (échec de migration = pas de démarrage)
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn main:app --host 0.0.0.0 --port 8000"]
