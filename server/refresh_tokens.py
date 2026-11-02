"""Stockage des refresh tokens : seule l'empreinte SHA-256 est conservée en base."""
import hashlib

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from auth import create_refresh_token
from models import RefreshToken


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def issue_refresh_token(db: AsyncSession, user_id: int) -> str:
    """Crée un jeton, enregistre son empreinte (sans commit) et renvoie le jeton brut."""
    token, expires_at = create_refresh_token({"sub": str(user_id)})
    db.add(RefreshToken(user_id=user_id, token_hash=hash_refresh_token(token), expires_at=expires_at))
    return token


async def revoke_refresh_token(db: AsyncSession, token: str) -> None:
    """Supprime ce jeton (sans commit)."""
    await db.execute(delete(RefreshToken).where(RefreshToken.token_hash == hash_refresh_token(token)))


async def revoke_all_refresh_tokens(db: AsyncSession, user_id: int) -> None:
    """Supprime tous les jetons d'un utilisateur (sans commit)."""
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user_id))
