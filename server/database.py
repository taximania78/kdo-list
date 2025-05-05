from contextlib import asynccontextmanager
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os

# DATABASE_USER = os.getenv("DATABASE_USER", "admin")
# DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD", "admin")
# DATABASE_HOST = os.getenv("DATABASE_HOST", "REDACTED-IP")
# DATABASE_PORT = "5432"
# DATABASE_NAME = os.getenv("POSTGRES_DB", "kdo")

# DATABASE_URL = f"postgresql+asyncpg://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"

DATABASE_URL = "postgresql+asyncpg://admin:admin@REDACTED-IP:5432/kdo"

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
     pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session