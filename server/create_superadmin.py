"""Bootstrap idempotent : crée le 1er super administrateur et la liste commune.
Variables d'env requises : SUPERADMIN_NAME, SUPERADMIN_PASSWORD.
"""
import asyncio
import os
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from database import engine
from models import User, GiftList
from auth import hash_password

SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def create_superadmin(session) -> None:
    existing = (await session.execute(select(User).where(User.isMegaAdmin == True))).scalars().first()
    if existing:
        print("Un super administrateur existe déjà — rien à faire.")
    else:
        name = os.getenv("SUPERADMIN_NAME")
        password = os.getenv("SUPERADMIN_PASSWORD")
        if not name or not password:
            raise RuntimeError("SUPERADMIN_NAME et SUPERADMIN_PASSWORD doivent être définis.")
        session.add(User(
            name=name, password=hash_password(password),
            isAdmin=True, isMegaAdmin=True, firstConnection=True,
        ))
        await session.commit()
        print(f"Super administrateur '{name}' créé (mot de passe à changer à la 1re connexion).")

    common = (await session.execute(select(GiftList).where(GiftList.is_common == True))).scalars().first()
    if not common:
        session.add(GiftList(slug="commune", label="Liste commune", owner_id=None, is_common=True, enabled=True))
        await session.commit()
        print("Liste commune créée.")


async def _main():
    async with SessionLocal() as session:
        await create_superadmin(session)


if __name__ == "__main__":
    asyncio.run(_main())
