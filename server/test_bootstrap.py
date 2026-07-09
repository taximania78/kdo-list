import pytest
from sqlalchemy.future import select
from main import app
from models import User, GiftList


@pytest.mark.asyncio
async def test_create_superadmin_idempotent(client, monkeypatch):
    monkeypatch.setenv("SUPERADMIN_NAME", "boss")
    monkeypatch.setenv("SUPERADMIN_PASSWORD", "Boss@1234")
    from database import get_db
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)
    from create_superadmin import create_superadmin

    await create_superadmin(session)
    mega = (await session.execute(select(User).where(User.isMegaAdmin == True))).scalars().all()
    assert len(mega) == 1 and mega[0].name == "boss"
    common = (await session.execute(select(GiftList).where(GiftList.is_common == True))).scalars().first()
    assert common is not None

    await create_superadmin(session)  # idempotent
    mega2 = (await session.execute(select(User).where(User.isMegaAdmin == True))).scalars().all()
    assert len(mega2) == 1
    await async_gen.aclose()
