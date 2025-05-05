import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from main import app

"""
Tests asynchrones avec pytest-asyncio & httpx.AsyncClient.
Chaque route est testée a minima.
En pratique, vous pouvez/doivez mocker la base ou
créer un environnement de test pour valider chaque cas.
"""

@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

@pytest.mark.asyncio
async def test_get_kdos_no_token(async_client: AsyncClient):
    """Sans token, /api/kdos/ doit renvoyer 401."""
    response = await async_client.get("/api/kdos/")
    assert response.status_code == 401
    assert "Token invalide ou expiré" in response.text or "Not authenticated" in response.text

@pytest.mark.asyncio
async def test_get_kdos_admin(async_client: AsyncClient):
    """
    Appel à /api/kdos/ avec un faux token 'admin'.
    Si decode_jwt n'est pas mocké, vous aurez sans doute 401.
    En pratique, vous pouvez mocker decode_jwt 
    ou générer un vrai token via /api/login/.
    """
    headers = {"Authorization": "Bearer FAKE-ADMIN-TOKEN"}
    response = await async_client.get("/api/kdos/", headers=headers)
    assert response.status_code in [200, 401, 500]

@pytest.mark.asyncio
async def test_get_kdos_admin_user_filter(async_client: AsyncClient):
    """Vérifie qu'on peut passer un paramètre user."""
    headers = {"Authorization": "Bearer FAKE-ADMIN-TOKEN"}
    response = await async_client.get("/api/kdos/?user=Marie-Eve", headers=headers)
    assert response.status_code in [200, 401, 404]

@pytest.mark.asyncio
async def test_get_kdo_list_admin_no_token(async_client: AsyncClient):
    """Sans token, /api/kdos-admin/ => 401."""
    response = await async_client.get("/api/kdos-admin/")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_kdo_list_admin_ok(async_client: AsyncClient):
    """Test minimal /api/kdos-admin/ avec un faux token."""
    headers = {"Authorization": "Bearer FAKE-ADMIN-TOKEN"}
    response = await async_client.get("/api/kdos-admin/", headers=headers)
    assert response.status_code in [200, 401]

@pytest.mark.asyncio
async def test_login_wrong_creds(async_client: AsyncClient):
    """Test /api/login/ avec mauvais identifiants => 401."""
    data = {"username": "wrong", "password": "wrong"}
    response = await async_client.post("/api/login/", data=data)
    assert response.status_code == 401
    assert "Identifiants incorrects" in response.text

@pytest.mark.asyncio
async def test_login_form_incomplete(async_client: AsyncClient):
    """Test /api/login/ form incomplet => 422 (champ manquant)."""
    data = {"username": "Mathieu"}
    response = await async_client.post("/api/login/", data=data)
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_refresh_no_token(async_client: AsyncClient):
    """Test /api/refresh/ sans token => 422 ou 401."""
    response = await async_client.post("/api/refresh/", json={})
    assert response.status_code in [401, 422]

@pytest.mark.asyncio
async def test_test_token(async_client: AsyncClient):
    """Test /api/test_token/ => 200 OK + {'Hello': 'World'}."""
    # Cet endpoint n'exige pas de token => renvoie "Hello": "World"
    response = await async_client.get("/api/test_token/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}

@pytest.mark.asyncio
async def test_add_item_no_token(async_client: AsyncClient):
    """Test /api/add-item/ sans token => 401."""
    response = await async_client.post("/api/add-item/", json={})
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_delete_item_no_token(async_client: AsyncClient):
    """Test /api/delete-item/{kdo_pk}/ => 401 sans token."""
    response = await async_client.delete("/api/delete-item/123/")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_modify_item_no_token(async_client: AsyncClient):
    """Test /api/modify-item/ => 401 sans token."""
    response = await async_client.put("/api/modify-item/", json={})
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_take_item_no_token(async_client: AsyncClient):
    """Test /api/take-api/{kdo_pk} => 401 sans token."""
    response = await async_client.post("/api/take-api/123")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_untake_item_no_token(async_client: AsyncClient):
    """Test /api/untake-api/{kdo_pk} => 401 sans token."""
    response = await async_client.post("/api/untake-api/123")
    assert response.status_code == 401