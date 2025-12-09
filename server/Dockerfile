# Dockerfile for FastAPI application
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup appuser

# Copy the requirements file and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY --chown=appuser:appgroup . .

# Passer à l'utilisateur non-root
USER appuser

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
