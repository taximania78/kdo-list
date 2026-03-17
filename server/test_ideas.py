import pytest
import pytest_asyncio
from httpx import AsyncClient
from main import app
from models import User, GiftList, Idea
from auth import hash_password

@pytest_asyncio.fixture
async def setup_test_ideas(client: AsyncClient, admin_token: str, user_token: str):
    from database import get_db
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)

    # Utilisateurs
    admin_user = User(
        name="admin", password=hash_password("Admin@123"),
        isAdmin=True, isMegaAdmin=True, firstConnection=False
    )
    normal_user = User(
        name="user", password=hash_password("NormalUser@123"),
        isAdmin=False, isMegaAdmin=False, firstConnection=False
    )
    user2 = User(
        name="user2", password=hash_password("User2@123"),
        isAdmin=False, isMegaAdmin=False, firstConnection=False
    )

    session.add_all([admin_user, normal_user, user2])
    await session.commit()
    await session.refresh(admin_user)
    await session.refresh(normal_user)
    await session.refresh(user2)

    # Listes
    list_user = GiftList(slug="user", label="User's List", user_name="user", enabled=True)
    list_common = GiftList(slug="common", label="Common List", user_name=None, enabled=True)

    session.add_all([list_user, list_common])
    await session.commit()
    await session.refresh(list_user)
    await session.refresh(list_common)

    # Idées existantes
    idea_user = Idea(
        name="Idea User", price=10.0, url="http://test.com", imageDisplay="unknown.jpg", image="",
        userId=normal_user.id, list_id=list_user.id,
        availability=True, comment=""
    )
    idea_common = Idea(
        name="Idea Common", price=20.0, url="", imageDisplay="unknown.jpg", image="",
        userId=None, list_id=list_common.id,
        availability=True, comment=""
    )
    idea_taken = Idea(
        name="Idea Taken", price=30.0, url="", imageDisplay="unknown.jpg", image="",
        userId=normal_user.id, list_id=list_user.id,
        availability=False, takenById=user2.id, comment=""
    )

    session.add_all([idea_user, idea_common, idea_taken])
    await session.commit()
    await session.refresh(idea_user)
    await session.refresh(idea_common)
    await session.refresh(idea_taken)

    await async_gen.aclose()
    
    return {
        "admin": admin_user, "user": normal_user, "user2": user2,
        "list_user": list_user, "list_common": list_common,
        "idea_user": idea_user, "idea_common": idea_common, "idea_taken": idea_taken
    }

@pytest.mark.asyncio
async def test_add_item_as_admin(client: AsyncClient, admin_token: str, setup_test_ideas):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "name": "New Gift",
        "comment": "Nice gift",
        "price": 42.5,
        "url": "https://amazon.com",
        "image": "",
        "imageDisplay": "unknown.jpg",
        "list_slug": "user"
    }
    response = await client.post("/api/add-item/", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "id" in response.json()

@pytest.mark.asyncio
async def test_add_item_as_user(client: AsyncClient, user_token: str, setup_test_ideas):
    headers = {"Authorization": f"Bearer {user_token}"}
    payload = {
        "name": "New Gift",
        "price": 10.0,
        "list_slug": "user"
    }
    response = await client.post("/api/add-item/", json=payload, headers=headers)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_kdos_all(client: AsyncClient, user_token: str, setup_test_ideas):
    headers = {"Authorization": f"Bearer {user_token}"}
    response = await client.get("/api/kdos/?user=all", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3

@pytest.mark.asyncio
async def test_get_kdos_admin_filter(client: AsyncClient, admin_token: str, setup_test_ideas):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Un admin ne verra pas ses propres Kdos via ce Endpoint normal. Il verra Idea User et Idea Common
    response = await client.get("/api/kdos/?user=all", headers=headers)
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_modify_item_as_admin(client: AsyncClient, admin_token: str, setup_test_ideas):
    headers = {"Authorization": f"Bearer {admin_token}"}
    idea_id = setup_test_ideas["idea_user"].id
    
    payload = {
        "id": idea_id,
        "name": "Modified Idea User",
        "price": 15.0
    }
    response = await client.put("/api/modify-item/", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True

@pytest.mark.asyncio
async def test_modify_item_as_user(client: AsyncClient, user_token: str, setup_test_ideas):
    headers = {"Authorization": f"Bearer {user_token}"}
    idea_id = setup_test_ideas["idea_user"].id
    
    payload = {
        "id": idea_id,
        "name": "Modified Idea User",
    }
    response = await client.put("/api/modify-item/", json=payload, headers=headers)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_delete_item_as_admin(client: AsyncClient, admin_token: str, setup_test_ideas):
    headers = {"Authorization": f"Bearer {admin_token}"}
    idea_id = setup_test_ideas["idea_user"].id
    
    response = await client.delete(f"/api/delete-item/{idea_id}/", headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True

@pytest.mark.asyncio
async def test_take_item(client: AsyncClient, user_token: str, setup_test_ideas):
    headers = {"Authorization": f"Bearer {user_token}"}
    idea_id = setup_test_ideas["idea_common"].id
    
    response = await client.post(f"/api/take-api/{idea_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True

@pytest.mark.asyncio
async def test_take_item_already_taken(client: AsyncClient, user_token: str, setup_test_ideas):
    headers = {"Authorization": f"Bearer {user_token}"}
    idea_id = setup_test_ideas["idea_taken"].id
    
    response = await client.post(f"/api/take-api/{idea_id}", headers=headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "Idée déjà prise"

@pytest.mark.asyncio
async def test_untake_item(client: AsyncClient, user_token: str, setup_test_ideas):
    headers = {"Authorization": f"Bearer {user_token}"}
    idea_id = setup_test_ideas["idea_taken"].id
    
    response = await client.post(f"/api/untake-api/{idea_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True
