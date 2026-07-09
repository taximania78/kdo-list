import pytest
import pytest_asyncio
from httpx import AsyncClient
from main import app
from models import User, Idea, GiftList
from auth import hash_password

@pytest_asyncio.fixture
async def setup_test_utils(client: AsyncClient, admin_token: str, user_token: str):
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

    session.add_all([admin_user, normal_user])
    await session.commit()
    await session.refresh(admin_user)
    await session.refresh(normal_user)

    # Idées existantes pour le CSV
    idea1 = Idea(
        name="Idea 1", price=10.0, url="http://test1.com", imageDisplay="unknown.jpg", image="",
        userId=normal_user.id, list_id=None,
        availability=True, comment=""
    )
    idea2 = Idea(
        name="Idea 2", price=20.0, url="", imageDisplay="unknown.jpg", image="",
        userId=admin_user.id, list_id=None,
        availability=True, comment=""
    )

    session.add_all([idea1, idea2])
    await session.commit()

    await async_gen.aclose()
    
    return {"admin": admin_user, "user": normal_user}

@pytest.mark.asyncio
async def test_export_csv_as_admin(client: AsyncClient, admin_token: str, setup_test_utils):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/export-csv/", headers=headers)
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment; filename=ideas_export.csv" in response.headers["content-disposition"]
    
    csv_content = response.text
    assert "Nom de l'idée,URL,Pour qui" in csv_content
    assert "Idea 1,http://test1.com,user" in csv_content
    # Idea 2 n'a pas d'URL
    assert "Idea 2,,admin" in csv_content

@pytest.mark.asyncio
async def test_export_csv_as_user(client: AsyncClient, user_token: str, setup_test_utils):
    headers = {"Authorization": f"Bearer {user_token}"}
    response = await client.get("/api/export-csv/", headers=headers)
    assert response.status_code == 401
    assert "Non autorisé" in response.json()["detail"]

@pytest.mark.asyncio
async def test_fetch_image_not_found(client: AsyncClient):
    response = await client.get("/api/kdos/does_not_exist_image_xyz.jpg")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_fetch_image_invalid_path(client: AsyncClient):
    # Test path traversal prevention.
    # We use a filename that contains '..' but doesn't resolve out of the base URL
    response = await client.get("/api/kdos/somefile..txt")
    assert response.status_code == 400
    assert response.json()["detail"] == "Chemin invalide"

    # For startswith("/"), we URL-encode the slash so it reaches the path variable
    response = await client.get("/api/kdos/%2Fetc%2Fpasswd")
    assert response.status_code in [400, 404]
