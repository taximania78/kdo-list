import asyncio
from database import engine
from models import Base

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all) 
    print("Tables créées avec succès !")

if __name__ == "__main__":
    asyncio.run(init_db())