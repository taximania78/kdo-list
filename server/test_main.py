import pytest
import pytest_asyncio
from httpx import AsyncClient

# Test if access without token is blocked
@pytest.mark.asyncio
async def test_get_kdos_no_token(client: AsyncClient):
    """Sans token, /api/kdos/ doit renvoyer 401."""
    response = await client.get("/api/kdos/")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_kdos_admin(client: AsyncClient, admin_token: str):
    """
    Appel à /api/kdos/ avec un vrai token 'admin'
    """
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/kdos/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_get_kdos_admin_user_filter(client: AsyncClient, admin_token: str):
    """Vérifie qu'on peut passer un paramètre user."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    # This might return 404 since the DB is empty, or 200 with an empty list depending on query structure
    response = await client.get("/api/kdos/?user=Marie-Eve", headers=headers)
    assert response.status_code in [200, 404]

@pytest.mark.asyncio
async def test_get_kdo_list_admin_no_token(client: AsyncClient):
    """Sans token, /api/kdos-admin/ => 401."""
    response = await client.get("/api/kdos-admin/")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_kdo_list_admin_ok(client: AsyncClient, admin_token: str):
    """Test minimal /api/kdos-admin/ avec un token admin."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/kdos-admin/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_login_wrong_creds(client: AsyncClient):
    """Test /api/login/ avec mauvais identifiants => 401."""
    data = {"username": "wrong", "password": "wrong"}
    response = await client.post("/api/login/", data=data)
    assert response.status_code == 401
    assert "Identifiants incorrects" in response.text

@pytest.mark.asyncio
async def test_test_token(client: AsyncClient):
    """Test /api/test_token/ => 200 OK + {'Hello': 'World'}."""
    response = await client.get("/api/test_token/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}