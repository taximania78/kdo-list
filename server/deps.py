"""Dépendances FastAPI d'authentification et d'autorisation."""
from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from auth import decode_jwt_of_type

# Utilisé pour récupérer le token dans les headers (Bearer <token>)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")


@dataclass(frozen=True)
class CurrentUser:
    id: int
    username: str
    is_admin: bool
    is_megaadmin: bool


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _forbidden() -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non autorisé")


def get_current_user(token: str = Depends(oauth2_scheme)) -> CurrentUser:
    """Utilisateur authentifié par un jeton d'accès valide, sinon 401."""
    payload = decode_jwt_of_type(token, "access")
    if payload is None:
        raise _unauthorized()
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise _unauthorized()
    return CurrentUser(
        id=user_id,
        username=payload.get("username", ""),
        is_admin=bool(payload.get("isAdmin")),
        is_megaadmin=bool(payload.get("isMegaAdmin")),
    )


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Exige un administrateur (isAdmin), sinon 403."""
    if not user.is_admin:
        raise _forbidden()
    return user


def require_megaadmin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Exige un super administrateur (isMegaAdmin), sinon 403."""
    if not user.is_megaadmin:
        raise _forbidden()
    return user
