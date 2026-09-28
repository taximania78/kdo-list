import pytest
import pytest_asyncio
from httpx import AsyncClient
from main import app
from models import User, GiftList, Idea
from auth import create_access_token, hash_password

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
    list_user = GiftList(slug="user", label="User's List", owner_id=normal_user.id, enabled=True)
    list_common = GiftList(slug="common", label="Common List", owner_id=None, is_common=True, enabled=True)

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
    assert response.status_code == 403

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
    assert response.status_code == 403

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
async def test_untake_item(client: AsyncClient, setup_test_ideas):
    # Seul celui qui a réservé (user2) peut libérer : voir test_reservations.py
    user2 = setup_test_ideas["user2"]
    token = create_access_token({"sub": str(user2.id), "username": user2.name, "isAdmin": False, "isMegaAdmin": False})
    headers = {"Authorization": f"Bearer {token}"}
    idea_id = setup_test_ideas["idea_taken"].id
    
    response = await client.post(f"/api/untake-api/{idea_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True


@pytest.mark.asyncio
async def test_delete_item_as_user_forbidden(client: AsyncClient, user_token: str, setup_test_ideas):
    headers = {"Authorization": f"Bearer {user_token}"}
    idea_id = setup_test_ideas["idea_user"].id
    response = await client.delete(f"/api/delete-item/{idea_id}/", headers=headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_add_item_without_optional_fields(client: AsyncClient, admin_token: str, setup_test_ideas):
    """Commentaire, URL et image sont facultatifs (auparavant : 500 sur une base créée depuis les modèles)."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.post("/api/add-item/", json={"name": "Vélo", "price": 10.0, "list_slug": "user"}, headers=headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_modify_item_can_clear_price_and_url(client: AsyncClient, admin_token: str, setup_test_ideas):
    """Vider le prix et l'URL dans le formulaire de modification les efface en base."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    idea_id = setup_test_ideas["idea_user"].id
    response = await client.put("/api/modify-item/", json={"id": idea_id, "price": None, "url": None}, headers=headers)
    assert response.status_code == 200

    from database import get_db
    from sqlalchemy.future import select
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)
    idea = (await session.execute(select(Idea).where(Idea.id == idea_id))).scalars().first()
    await async_gen.aclose()
    assert idea.price is None
    assert idea.url is None


@pytest_asyncio.fixture
async def setup_ordering_ideas(client: AsyncClient):
    """Idées insérées volontairement dans le désordre, avec un doublon insensible à la
    casse (« Vélo » / « vélo ») pour vérifier que l'id départage les égalités."""
    from database import get_db
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)

    admin_user = User(name="admin", password=hash_password("Admin@123"), isAdmin=True, isMegaAdmin=True, firstConnection=False)
    normal_user = User(name="user", password=hash_password("NormalUser@123"), isAdmin=False, isMegaAdmin=False, firstConnection=False)
    session.add_all([admin_user, normal_user])
    await session.flush()

    list_user = GiftList(slug="user", label="User's List", owner_id=normal_user.id, enabled=True)
    session.add(list_user)
    await session.flush()

    def idea(name):
        return Idea(
            name=name, price=10.0, url="", image="", imageDisplay="unknown.jpg", comment="",
            userId=normal_user.id, list_id=list_user.id, availability=True,
        )

    velo = idea("Vélo")
    casque = idea("Casque")
    appareil = idea("appareil photo")
    casque_bis = idea("casque bis")
    velo_minuscule = idea("vélo")
    session.add_all([velo, casque, appareil, casque_bis, velo_minuscule])
    await session.commit()
    for i in (velo, casque, appareil, casque_bis, velo_minuscule):
        await session.refresh(i)

    await async_gen.aclose()
    return {"casque": casque}


@pytest.mark.asyncio
async def test_get_kdos_sorted_alphabetically(client: AsyncClient, user_token: str, setup_ordering_ideas):
    """Ordre alphabétique insensible à la casse, id en cas d'égalité ; stable après une
    réservation au milieu de la liste (auparavant, PostgreSQL pouvait renvoyer la ligne
    modifiée en fin de résultat faute d'ORDER BY)."""
    headers = {"Authorization": f"Bearer {user_token}"}
    expected_order = ["appareil photo", "Casque", "casque bis", "Vélo", "vélo"]

    response = await client.get("/api/kdos/?list=user", headers=headers)
    assert response.status_code == 200
    assert [row["name"] for row in response.json()] == expected_order

    casque_id = setup_ordering_ideas["casque"].id
    take_response = await client.post(f"/api/take-api/{casque_id}", headers=headers)
    assert take_response.status_code == 200

    response_after = await client.get("/api/kdos/?list=user", headers=headers)
    assert response_after.status_code == 200
    assert [row["name"] for row in response_after.json()] == expected_order


@pytest.mark.asyncio
async def test_get_kdos_admin_sorted_alphabetically(client: AsyncClient, admin_token: str, setup_ordering_ideas):
    headers = {"Authorization": f"Bearer {admin_token}"}
    expected_order = ["appareil photo", "Casque", "casque bis", "Vélo", "vélo"]

    response = await client.get("/api/kdos-admin/?list=user", headers=headers)
    assert response.status_code == 200
    assert [row["name"] for row in response.json()] == expected_order
