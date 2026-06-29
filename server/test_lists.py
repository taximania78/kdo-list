import pytest
import pytest_asyncio
from httpx import AsyncClient
from main import app
from models import User, GiftList
from auth import hash_password
from test_ideas import setup_test_ideas

@pytest_asyncio.fixture
async def setup_test_lists(client: AsyncClient, admin_token: str, user_token: str):
    from database import get_db
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)

    # Création des utilisateurs
    admin_user = User(
        name="admin",
        password=hash_password("Admin@123"),
        isAdmin=True,
        isMegaAdmin=True,
        firstConnection=False
    )
    
    normal_user = User(
        name="user",
        password=hash_password("NormalUser@123"),
        isAdmin=False,
        isMegaAdmin=False,
        firstConnection=False
    )

    session.add(admin_user)
    session.add(normal_user)
    await session.commit()
    await session.refresh(admin_user)
    await session.refresh(normal_user)

    # Création des listes
    list_admin = GiftList(slug="admin", label="Admin's List", owner_id=admin_user.id, enabled=True)
    list_user = GiftList(slug="user", label="User's List", owner_id=normal_user.id, enabled=True)
    list_common = GiftList(slug="common", label="Common List", owner_id=None, is_common=True, enabled=True)
    list_disabled = GiftList(slug="disabled", label="Disabled List", owner_id=normal_user.id, enabled=False)

    session.add_all([list_admin, list_user, list_common, list_disabled])
    await session.commit()

    await async_gen.aclose()
    
    return {"admin": admin_user, "user": normal_user}

@pytest.mark.asyncio
async def test_get_lists_as_user(client: AsyncClient, user_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {user_token}"}
    response = await client.get("/api/lists/", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    # L'utilisateur normal voit les listes actives : admin, user, common
    assert len(data) == 3
    slugs = [item["slug"] for item in data]
    assert "admin" in slugs
    assert "user" in slugs
    assert "common" in slugs
    assert "disabled" not in slugs

@pytest.mark.asyncio
async def test_get_lists_as_admin(client: AsyncClient, admin_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/lists/", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    # L'admin ne voit pas sa propre liste ni la commune
    assert len(data) == 1
    slugs = [item["slug"] for item in data]
    assert "user" in slugs
    assert "admin" not in slugs
    assert "common" not in slugs

@pytest.mark.asyncio
async def test_get_all_lists_as_admin(client: AsyncClient, admin_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/lists/all/", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    # get_all_lists renvoie toutes les listes
    assert len(data) == 4
    slugs = [item["slug"] for item in data]
    assert "disabled" in slugs
    assert "admin" in slugs
    assert "common" in slugs

@pytest.mark.asyncio
async def test_get_all_lists_as_user(client: AsyncClient, user_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {user_token}"}
    response = await client.get("/api/lists/all/", headers=headers)
    # Accessible uniquement par un admin
    assert response.status_code == 401
    assert "Non autorisé" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_lists_no_token(client: AsyncClient, setup_test_lists):
    response = await client.get("/api/lists/")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_toggle_list_as_admin(client: AsyncClient, admin_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Toggle 'disabled' to true
    res1 = await client.patch("/api/lists/disabled/toggle", headers=headers)
    assert res1.status_code == 200
    assert res1.json()["enabled"] is True
    assert res1.json()["slug"] == "disabled"

    # Toggle 'disabled' back to false
    res2 = await client.patch("/api/lists/disabled/toggle", headers=headers)
    assert res2.status_code == 200
    assert res2.json()["enabled"] is False

@pytest.mark.asyncio
async def test_toggle_list_as_user(client: AsyncClient, user_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {user_token}"}
    response = await client.patch("/api/lists/user/toggle", headers=headers)
    assert response.status_code == 403
    assert "Non autorisé" in response.json()["detail"]

@pytest.mark.asyncio
async def test_toggle_list_not_found(client: AsyncClient, admin_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.patch("/api/lists/non-existent/toggle", headers=headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Liste non trouvée"

@pytest.mark.asyncio
async def test_toggle_list_non_mega_admin_forbidden(client: AsyncClient, admin_non_mega_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_non_mega_token}"}
    response = await client.patch("/api/lists/user/toggle", headers=headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_create_list_with_owner(client: AsyncClient, admin_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # un nouvel user sans liste
    await client.post("/api/create-user/", json={"name": "carla", "password": "Carla@123"}, headers=headers)
    users = (await client.get("/api/users/", headers=headers)).json()
    carla_id = next(u["id"] for u in users if u["name"] == "carla")
    res = await client.post("/api/lists/", json={"label": "Carla", "owner_id": carla_id}, headers=headers)
    assert res.status_code == 200
    assert res.json()["slug"] == "carla"

@pytest.mark.asyncio
async def test_create_list_without_owner_visible_to_admin(client: AsyncClient, admin_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.post("/api/lists/", json={"label": "Léa"}, headers=headers)
    assert res.status_code == 200
    slug = res.json()["slug"]
    assert slug == "lea"
    lists = (await client.get("/api/lists/", headers=headers)).json()
    assert slug in [l["slug"] for l in lists]  # liste sans compte visible de l'admin

@pytest.mark.asyncio
async def test_create_list_slug_uniqueness(client: AsyncClient, admin_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_token}"}
    a = await client.post("/api/lists/", json={"label": "Noël"}, headers=headers)
    b = await client.post("/api/lists/", json={"label": "Noël"}, headers=headers)
    assert a.json()["slug"] == "noel"
    assert b.json()["slug"] == "noel-2"

@pytest.mark.asyncio
async def test_create_list_owner_already_has_one(client: AsyncClient, admin_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_token}"}
    owner_id = setup_test_lists["user"].id  # possède déjà "user"
    res = await client.post("/api/lists/", json={"label": "Doublon", "owner_id": owner_id}, headers=headers)
    assert res.status_code == 400

@pytest.mark.asyncio
async def test_create_list_non_mega_forbidden(client: AsyncClient, admin_non_mega_token: str):
    headers = {"Authorization": f"Bearer {admin_non_mega_token}"}
    res = await client.post("/api/lists/", json={"label": "X"}, headers=headers)
    assert res.status_code == 403

@pytest.mark.asyncio
async def test_rename_list(client: AsyncClient, admin_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.patch("/api/lists/user", json={"label": "Renommée"}, headers=headers)
    assert res.status_code == 200
    lists = (await client.get("/api/lists/all/", headers=headers)).json()
    assert any(l["slug"] == "user" and l["label"] == "Renommée" for l in lists)

@pytest.mark.asyncio
async def test_delete_list_cascade(client: AsyncClient, admin_token: str, setup_test_ideas, monkeypatch):
    import main
    removed = []
    monkeypatch.setattr(main, "remove_image", lambda pk: removed.append(pk))
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.delete("/api/lists/user", headers=headers)
    assert res.status_code == 200
    # idées de la liste 'user' supprimées
    kdos = (await client.get("/api/kdos/?list=user", headers=headers)).json()
    assert kdos == []
    assert len(removed) >= 1  # remove_image appelé pour chaque idée supprimée
