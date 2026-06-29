import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from migrate_owner_id import backfill_owner_and_common


@pytest.mark.asyncio
async def test_backfill_owner_and_common():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.execute(text("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)"))
        await conn.execute(text(
            "CREATE TABLE gift_lists (id INTEGER PRIMARY KEY, slug TEXT, label TEXT, "
            "user_name TEXT, owner_id INTEGER, is_common BOOLEAN DEFAULT 0, enabled BOOLEAN DEFAULT 1)"
        ))
        await conn.execute(text("INSERT INTO users (id, name) VALUES (1, 'alice'), (2, 'bob')"))
        await conn.execute(text(
            "INSERT INTO gift_lists (slug, label, user_name) VALUES "
            "('alice', 'Alice', 'alice'), ('commune', 'Commune', NULL)"
        ))
        await backfill_owner_and_common(conn)

        rows = (await conn.execute(text(
            "SELECT slug, owner_id, is_common FROM gift_lists ORDER BY slug"
        ))).all()
    await engine.dispose()

    by_slug = {r[0]: (r[1], r[2]) for r in rows}
    assert by_slug["alice"][0] == 1          # owner_id backfillé depuis user_name
    assert bool(by_slug["alice"][1]) is False
    assert by_slug["commune"][0] is None
    assert bool(by_slug["commune"][1]) is True  # ancienne commune (user_name NULL) -> is_common
