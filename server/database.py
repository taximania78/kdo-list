from contextlib import asynccontextmanager
from typing import AsyncGenerator
from sqlalchemy.engine import URL
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from config import get_config, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_NAME
import os


def build_database_url(user: str, password: str, host: str, port: str, name: str) -> URL:
    """URL de connexion dont chaque partie est échappée (mot de passe avec @, / ou : compris)."""
    return URL.create(
        drivername="postgresql+asyncpg",
        username=user,
        password=password,
        host=host,
        port=int(port),
        database=name,
    )


DATABASE_URL = build_database_url(DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME)

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
     pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session