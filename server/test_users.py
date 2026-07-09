import pytest
import pytest_asyncio
import asyncio
from httpx import AsyncClient
from main import app
from models import User
from auth import hash_password


@pytest_asyncio.fixture
async def setup_test_users(client: AsyncClient, admin_token: str):
    # D'abord on peuple la db avec les utilisateurs nécessaires.
    from database import get_db
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)

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
        firstConnection=True
    )

    session.add(admin_user)
    session.add(normal_user)
    await session.commit()
    await session.refresh(admin_user)
    await session.refresh(normal_user)

    await async_gen.aclose()
    
    return {"admin": admin_user, "user": normal_user}


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, setup_test_users):
    response = await client.post("/api/login/", data={"username": "user", "password": "NormalUser@123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["username"] == "user"
    assert data["firstConnection"] is True

@pytest.mark.asyncio
async def test_login_invalid(client: AsyncClient, setup_test_users):
    response = await client.post("/api/login/", data={"username": "user", "password": "WrongPassword"})
    assert response.status_code == 401
    assert "Identifiants" in response.json()["detail"]

@pytest.mark.asyncio
async def test_auth_route(client: AsyncClient, setup_test_users):
    login_res = await client.post("/api/login/", data={"username": "user", "password": "NormalUser@123"})
    token = login_res.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/api/auth/", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}

@pytest.mark.asyncio
async def test_create_user_by_admin(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "name": "newuser",
        "password": "NewUser@123",
        "isAdmin": False
    }
    response = await client.post("/api/create-user/", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Utilisateur créé avec succès"
    assert "id" in data

@pytest.mark.asyncio
async def test_create_user_duplicate(client: AsyncClient, admin_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "name": "user",  # Déjà existant
        "password": "NewUser@123",
        "isAdmin": False
    }
    response = await client.post("/api/create-user/", json=payload, headers=headers)
    assert response.status_code == 400
    assert "Nom d'utilisateur déjà pris" in response.json()["detail"]

@pytest.mark.asyncio
async def test_create_user_forbidden(client: AsyncClient, setup_test_users):
    # Un utilisateur normal ne peut pas créer d'utilisateurs
    login_res = await client.post("/api/login/", data={"username": "user", "password": "NormalUser@123"})
    token = login_res.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "hacker",
        "password": "Hack@123",
        "isAdmin": True
    }
    response = await client.post("/api/create-user/", json=payload, headers=headers)
    assert response.status_code == 403
    assert "Non autorisé" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_users(client: AsyncClient, admin_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/users/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    names = [u["name"] for u in data]
    assert "admin" in names
    assert "user" in names
    assert "isAdmin" in data[0]

@pytest.mark.asyncio
async def test_modify_password_first_connection(client: AsyncClient, setup_test_users):
    login_res = await client.post("/api/login/", data={"username": "user", "password": "NormalUser@123"})
    token = login_res.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "password": "New@Password1",
        "passwordConfirmation": "New@Password1",
        "firstConnection": True
    }
    response = await client.post("/api/modify-password/", json=payload, headers=headers)
    assert response.status_code == 200

    # On utilise un sleep de 1 seconde pour éviter une erreur d'intégrité de SQLite avec le cache de millisecondes des strings du JWT (au login suivant).
    # Vu qu'on ne doit pas modifier la BDD, on donne 1 seconde pour que la péremption du refresh token encodé soit différente !
    await asyncio.sleep(1)

    # Vérifie que la connexion marche avec le nv password et que firstConnection est passé à False
    login_res2 = await client.post("/api/login/", data={"username": "user", "password": "New@Password1"})
    assert login_res2.status_code == 200
    assert login_res2.json()["firstConnection"] is False

@pytest.mark.asyncio
async def test_modify_password_standard(client: AsyncClient, setup_test_users):
    # Test update of standard normal user
    # D'abord on enlève le firstConnection
    login_res = await client.post("/api/login/", data={"username": "user", "password": "NormalUser@123"})
    token = login_res.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "password": "Standard@Pass1",
        "passwordConfirmation": "Standard@Pass1",
        "currentPassword": "NormalUser@123",
        "firstConnection": False
    }
    # On met firstConnection à false pour simuler un update normal post première connexion
    res_mod = await client.post("/api/modify-password/", json=payload, headers=headers)
    assert res_mod.status_code == 200

    await asyncio.sleep(1)

    login_res2 = await client.post("/api/login/", data={"username": "user", "password": "Standard@Pass1"})
    assert login_res2.status_code == 200

@pytest.mark.asyncio
async def test_admin_reset_password(client: AsyncClient, admin_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_token}"}
    user_id = setup_test_users["user"].id
    
    payload = {
        "password": "AdminReset@12",
        "passwordConfirmation": "AdminReset@12",
        "currentPassword": "NormalUser@123",
        "firstConnection": True
    }
    
    response = await client.patch(f"/api/modify-password-admin/{user_id}", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Mot de passe mis à jour avec succès"

    await asyncio.sleep(1)

    login_res = await client.post("/api/login/", data={"username": "user", "password": "AdminReset@12"})
    assert login_res.status_code == 200
    assert login_res.json()["firstConnection"] is True

@pytest.mark.asyncio
async def test_delete_user(client: AsyncClient, admin_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_token}"}
    user_id = setup_test_users["user"].id
    
    response = await client.delete(f"/api/delete-user/{user_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Utilisateur supprimé avec succès"

    # Verify user is actually deleted
    login_res = await client.post("/api/login/", data={"username": "user", "password": "NormalUser@123"})
    assert login_res.status_code == 401

@pytest.mark.asyncio
async def test_create_user_non_mega_admin_forbidden(client: AsyncClient, admin_non_mega_token: str):
    headers = {"Authorization": f"Bearer {admin_non_mega_token}"}
    response = await client.post("/api/create-user/", json={"name": "newuser", "password": "NewUser@123"}, headers=headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_modify_password_admin_non_mega_forbidden(client: AsyncClient, admin_non_mega_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_non_mega_token}"}
    user_id = setup_test_users["user"].id
    payload = {"password": "Pwned@1234", "passwordConfirmation": "Pwned@1234", "firstConnection": True}
    response = await client.patch(f"/api/modify-password-admin/{user_id}", json=payload, headers=headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_delete_user_non_mega_forbidden(client: AsyncClient, admin_non_mega_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_non_mega_token}"}
    response = await client.delete(f"/api/delete-user/{setup_test_users['user'].id}", headers=headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_get_users_non_mega_forbidden(client: AsyncClient, admin_non_mega_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_non_mega_token}"}
    response = await client.get("/api/users/", headers=headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_create_user_with_admin_role(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.post("/api/create-user/", json={"name": "chief", "password": "Chief@123", "isAdmin": True}, headers=headers)
    assert res.status_code == 200
    login = await client.post("/api/login/", data={"username": "chief", "password": "Chief@123"})
    assert login.json()["isAdmin"] is True

@pytest.mark.asyncio
async def test_update_role_promote(client: AsyncClient, admin_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_token}"}
    user_id = setup_test_users["user"].id
    res = await client.patch(f"/api/users/{user_id}/role", json={"isAdmin": True}, headers=headers)
    assert res.status_code == 200
    import asyncio
    await asyncio.sleep(1)
    login = await client.post("/api/login/", data={"username": "user", "password": "NormalUser@123"})
    assert login.json()["isAdmin"] is True

@pytest.mark.asyncio
async def test_update_role_self_forbidden(client: AsyncClient, admin_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.patch("/api/users/1/role", json={"isAdmin": False}, headers=headers)  # sub du admin_token = "1"
    assert res.status_code == 400

@pytest.mark.asyncio
async def test_update_role_non_mega_forbidden(client: AsyncClient, admin_non_mega_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_non_mega_token}"}
    res = await client.patch(f"/api/users/{setup_test_users['user'].id}/role", json={"isAdmin": True}, headers=headers)
    assert res.status_code == 403
