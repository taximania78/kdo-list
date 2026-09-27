"""
Migration : création de la table app_settings (réglages de l'application, ex. thème).
Idempotente, n'insère aucune donnée et ne touche à aucune table existante.
À lancer une fois en production :  docker compose exec fastapi python migrate_app_settings.py
"""
import asyncio
from sqlalchemy import text


async def create_app_settings_table(conn):
    await conn.execute(text(
        "CREATE TABLE IF NOT EXISTS app_settings ("
        "key VARCHAR PRIMARY KEY, "
        "value VARCHAR NOT NULL)"
    ))


async def migrate():
    from database import engine
    async with engine.begin() as conn:
        await create_app_settings_table(conn)
    print("Migration app_settings terminée.")


if __name__ == "__main__":
    asyncio.run(migrate())
