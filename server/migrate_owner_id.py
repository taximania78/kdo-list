"""
Migration : remplacer GiftList.user_name par owner_id (FK users.id) + is_common.
À lancer une fois en production (PostgreSQL) après déploiement du nouveau code.
"""
import asyncio
from sqlalchemy import text
from database import engine


async def backfill_owner_and_common(conn):
    # owner_id depuis user_name (logique portable, testée sur SQLite)
    await conn.execute(text(
        "UPDATE gift_lists SET owner_id = (SELECT u.id FROM users u WHERE u.name = gift_lists.user_name) "
        "WHERE user_name IS NOT NULL AND owner_id IS NULL"
    ))
    # is_common pour l'ancienne commune (user_name NULL)
    await conn.execute(text("UPDATE gift_lists SET is_common = 1 WHERE user_name IS NULL"))


async def migrate():
    async with engine.begin() as conn:
        # DDL PostgreSQL (idempotent)
        await conn.execute(text(
            "ALTER TABLE gift_lists ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id)"
        ))
        await conn.execute(text(
            "ALTER TABLE gift_lists ADD COLUMN IF NOT EXISTS is_common BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        await backfill_owner_and_common(conn)
        await conn.execute(text("ALTER TABLE gift_lists DROP COLUMN IF EXISTS user_name"))
    print("Migration owner_id / is_common terminée.")


if __name__ == "__main__":
    asyncio.run(migrate())
