import strawberry
from typing import List, Optional
from sqlalchemy.future import select
from fastapi import Depends
from database import get_db, AsyncSession
from models import Product

@strawberry.type
class ProductType:
    id: int
    name: str
    price: float
    color: str
    year: int
    availability: Optional[bool]

@strawberry.type
class Query:
    @strawberry.field
    async def all_products(self) -> List[ProductType]:
        async with get_db() as db:
            result = await db.execute(select(Product))
            products = result.scalars().all()
            return [ProductType(id=p.id, name=p.name, price=p.price, color=p.color, year=p.year, availability=p.availability) for p in products]

schema = strawberry.Schema(query=Query)