"""Stockage des refresh tokens : seule l'empreinte SHA-256 est conservée en base."""
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Literal

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from auth import create_refresh_token
from models import RefreshToken

# Fenêtre de grâce : un jeton rejoué moins de 60 s après son échange est traité comme
# inconnu (401 simple). Une page de téléphone tuée en plein refresh ne doit pas
# déconnecter l'utilisateur sur tous ses appareils.
REUSE_GRACE_SECONDS = 60


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


async def consume_refresh_token(db: AsyncSession, token: str) -> Literal["ok", "reused", "unknown"]:
    """Marque ce jeton comme échangé, de façon atomique (sans commit).

    - "ok" : le jeton était actif, il est maintenant marqué (un seul appelant concurrent l'obtient) ;
    - "reused" : le jeton avait été échangé il y a plus de REUSE_GRACE_SECONDS, donc rejoué ;
    - "unknown" : aucune trace (révoqué par logout ou changement de mot de passe, ou jamais émis),
      ou échangé trop récemment (fenêtre de grâce).
    """
    token_hash = hash_refresh_token(token)
    now = datetime.now(timezone.utc)
    result = await db.execute(
        update(RefreshToken)
        .where(RefreshToken.token_hash == token_hash, RefreshToken.rotated_at.is_(None))
        .values(rotated_at=now)
    )
    if result.rowcount == 1:
        return "ok"
    # Seuil calculé en Python et comparé en SQL, comme expires_at (SQLite et PostgreSQL)
    grace_threshold = now - timedelta(seconds=REUSE_GRACE_SECONDS)
    already_rotated = await db.execute(
        select(RefreshToken.id).where(
            RefreshToken.token_hash == token_hash, RefreshToken.rotated_at < grace_threshold
        )
    )
    return "reused" if already_rotated.first() else "unknown"
