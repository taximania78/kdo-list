"""Règles de réservation : on ne réserve que ce qu'on voit, et seul celui qui a réservé
(ou un admin, sur une idée qu'il voit) peut libérer."""
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.future import select

from auth import create_access_token, hash_password
from database import get_db
from main import app
from models import GiftList, Idea, User


def _bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def user2_token():
    return create_access_token({"sub": "4", "username": "user2", "isAdmin": False, "isMegaAdmin": False})


@pytest_asyncio.fixture
async def setup_reservations(client: AsyncClient):
    """Ids alignés sur les jetons de conftest : admin=1 (super admin), user=2, petit-admin=3 ; user2=4."""
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)

    admin = User(name="admin", password=hash_password("Admin@123"), isAdmin=True, isMegaAdmin=True, firstConnection=False)
    user = User(name="user", password=hash_password("User@1234"), isAdmin=False, isMegaAdmin=False, firstConnection=False)
    petit_admin = User(name="petit-admin", password=hash_password("Admin@123"), isAdmin=True, isMegaAdmin=False, firstConnection=False)
    user2 = User(name="user2", password=hash_password("User2@123"), isAdmin=False, isMegaAdmin=False, firstConnection=False)
    for u in (admin, user, petit_admin, user2):
        session.add(u)
        await session.flush()

    list_user = GiftList(slug="user", label="Liste user", owner_id=user.id, is_common=False, enabled=True)
    list_petit = GiftList(slug="petit", label="Liste petit-admin", owner_id=petit_admin.id, is_common=False, enabled=True)
    list_common = GiftList(slug="commune", label="Liste commune", owner_id=None, is_common=True, enabled=True)
    list_off = GiftList(slug="off", label="Liste désactivée", owner_id=None, is_common=False, enabled=False)
    session.add_all([list_user, list_petit, list_common, list_off])
    await session.flush()

    def idea(name, owner, gift_list, taken_by=None):
        return Idea(
            name=name, price=10.0, url="", image="", imageDisplay="unknown.jpg", comment="",
            userId=owner.id if owner else None, list_id=gift_list.id,
            availability=taken_by is None, takenById=taken_by.id if taken_by else None,
        )

    ideas = {
        "user_free": idea("User libre", user, list_user),
        "user_taken_by_user2": idea("User pris par user2", user, list_user, taken_by=user2),
        "petit_free": idea("Petit libre", petit_admin, list_petit),
        "petit_taken_by_user2": idea("Petit pris par user2", petit_admin, list_petit, taken_by=user2),
        "common_free": idea("Commune libre", None, list_common),
        "common_taken_by_user2": idea("Commune prise par user2", None, list_common, taken_by=user2),
        "off_free": idea("Désactivée libre", None, list_off),
    }
    session.add_all(ideas.values())
    await session.commit()
    ids = {key: i.id for key, i in ideas.items()}
    await async_gen.aclose()
    return ids


async def _idea(idea_id: int) -> Idea:
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)
    result = (await session.execute(select(Idea).where(Idea.id == idea_id))).scalars().first()
    await async_gen.aclose()
    return result


# ─── Réserver ───────────────────────────────────────────────────────────

async def test_take_free_idea(client, user2_token, setup_reservations):
    idea_id = setup_reservations["user_free"]
    res = await client.post(f"/api/take-api/{idea_id}", headers=_bearer(user2_token))
    assert res.status_code == 200
    idea = await _idea(idea_id)
    assert idea.availability is False
    assert idea.takenById == 4


async def test_take_already_taken_is_400(client, user_token, setup_reservations):
    res = await client.post(f"/api/take-api/{setup_reservations['user_taken_by_user2']}", headers=_bearer(user_token))
    assert res.status_code == 400
    assert res.json()["detail"] == "Idée déjà prise"


async def test_take_unknown_idea_is_404(client, user_token, setup_reservations):
    res = await client.post("/api/take-api/9999", headers=_bearer(user_token))
    assert res.status_code == 404


async def test_admin_cannot_take_own_idea(client, admin_non_mega_token, setup_reservations):
    idea_id = setup_reservations["petit_free"]
    res = await client.post(f"/api/take-api/{idea_id}", headers=_bearer(admin_non_mega_token))
    assert res.status_code == 403
    assert (await _idea(idea_id)).availability is True


async def test_admin_cannot_take_common_idea(client, admin_non_mega_token, setup_reservations):
    idea_id = setup_reservations["common_free"]
    res = await client.post(f"/api/take-api/{idea_id}", headers=_bearer(admin_non_mega_token))
    assert res.status_code == 403
    assert (await _idea(idea_id)).availability is True


async def test_nobody_can_take_idea_of_disabled_list(client, user_token, setup_reservations):
    idea_id = setup_reservations["off_free"]
    res = await client.post(f"/api/take-api/{idea_id}", headers=_bearer(user_token))
    assert res.status_code == 403
    assert (await _idea(idea_id)).availability is True


async def test_admin_can_take_other_list_idea(client, admin_non_mega_token, setup_reservations):
    res = await client.post(f"/api/take-api/{setup_reservations['user_free']}", headers=_bearer(admin_non_mega_token))
    assert res.status_code == 200


async def test_user_can_take_common_idea(client, user_token, setup_reservations):
    res = await client.post(f"/api/take-api/{setup_reservations['common_free']}", headers=_bearer(user_token))
    assert res.status_code == 200


# ─── Libérer ────────────────────────────────────────────────────────────

async def test_taker_can_release(client, user2_token, setup_reservations):
    idea_id = setup_reservations["user_taken_by_user2"]
    res = await client.post(f"/api/untake-api/{idea_id}", headers=_bearer(user2_token))
    assert res.status_code == 200
    idea = await _idea(idea_id)
    assert idea.availability is True
    assert idea.takenById is None


async def test_user_cannot_release_someone_else_reservation(client, user_token, setup_reservations):
    idea_id = setup_reservations["common_taken_by_user2"]
    res = await client.post(f"/api/untake-api/{idea_id}", headers=_bearer(user_token))
    assert res.status_code == 403
    assert res.json()["detail"] == "Non autorisé"
    assert (await _idea(idea_id)).takenById == 4


async def test_admin_can_release_someone_else_reservation(client, admin_non_mega_token, setup_reservations):
    idea_id = setup_reservations["user_taken_by_user2"]
    res = await client.post(f"/api/untake-api/{idea_id}", headers=_bearer(admin_non_mega_token))
    assert res.status_code == 200
    assert (await _idea(idea_id)).availability is True


async def test_super_admin_can_release_someone_else_reservation(client, admin_token, setup_reservations):
    res = await client.post(f"/api/untake-api/{setup_reservations['petit_taken_by_user2']}", headers=_bearer(admin_token))
    assert res.status_code == 200


async def test_admin_cannot_release_reservation_on_own_idea(client, admin_non_mega_token, setup_reservations):
    """Libérer révélerait à l'admin qu'un de ses cadeaux est réservé : refusé."""
    idea_id = setup_reservations["petit_taken_by_user2"]
    res = await client.post(f"/api/untake-api/{idea_id}", headers=_bearer(admin_non_mega_token))
    assert res.status_code == 403
    assert (await _idea(idea_id)).takenById == 4


async def test_admin_cannot_release_reservation_on_common_idea(client, admin_non_mega_token, setup_reservations):
    idea_id = setup_reservations["common_taken_by_user2"]
    res = await client.post(f"/api/untake-api/{idea_id}", headers=_bearer(admin_non_mega_token))
    assert res.status_code == 403
    assert (await _idea(idea_id)).takenById == 4


async def test_release_free_idea_is_400(client, user_token, setup_reservations):
    res = await client.post(f"/api/untake-api/{setup_reservations['user_free']}", headers=_bearer(user_token))
    assert res.status_code == 400
    assert res.json()["detail"] == "Idée déjà libérée"


async def test_release_unknown_idea_is_404(client, user_token, setup_reservations):
    res = await client.post("/api/untake-api/9999", headers=_bearer(user_token))
    assert res.status_code == 404
