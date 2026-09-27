import csv
import io
import logging
import os.path
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, status, Request, Query
from fastapi.responses import FileResponse, Response
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import delete, or_, update
from sqlalchemy.orm import joinedload, aliased
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import GiftList, GiftListCreate, GiftListUpdate, GiftListResponse, GiftListToggle, Idea, IdeaCreate, IdeaUpdate, RefreshToken, RefreshTokenRequest, User, UserCreate, PasswordChange, RoleUpdate, AppSetting, ThemeResponse, ThemeUpdate, THEME_NAMES, DEFAULT_THEME
from database import get_db
from auth import (
    create_access_token,
    create_refresh_token,
    decode_jwt_of_type,
    hash_password,
    verify_password,
    verify_and_update_password,
)
from deps import CurrentUser, get_current_user, require_admin, require_megaadmin
from image import KDOS_DIR, get_image, remove_image
from config import MODE, URL_CONNECTION

from fastapi import FastAPI

app = FastAPI(
    docs_url=None if MODE == "production" else "/docs",        # désactive Swagger UI en production
    redoc_url=None if MODE == "production" else "/redoc",     # désactive ReDoc en production
    openapi_url=None if MODE == "production" else "/openapi.json"  # désactive OpenAPI en production
)


# Autoriser toutes les origines (⚠️ à limiter en production)
if MODE == "production":
    origins = [
        URL_CONNECTION,  # Frontend Next.js en production
    ]
else:
    origins = [
        "http://localhost:3000",  # Frontend Next.js en développement
        "http://127.0.0.1:3000",  # Autre variante de localhost
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Autoriser les domaines spécifiés
    allow_credentials=True,  # Autoriser l'envoi des cookies
    allow_methods=["*"],  # Autoriser toutes les méthodes (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Autoriser tous les headers
)

logger = logging.getLogger(__name__)

# ─── Gift Lists Endpoints ───────────────────────────────────────────────

def _slugify(label: str) -> str:
    normalized = unicodedata.normalize("NFKD", label).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")
    return slug or "liste"


async def _unique_slug(db: AsyncSession, base: str) -> str:
    candidate, i = base, 2
    while True:
        result = await db.execute(select(GiftList).where(GiftList.slug == candidate))
        if not result.scalars().first():
            return candidate
        candidate = f"{base}-{i}"
        i += 1


def _serialize_list(gl: GiftList) -> GiftListResponse:
    return GiftListResponse(
        slug=gl.slug,
        label=gl.label,
        owner_id=gl.owner_id,
        owner_name=gl.owner.name if gl.owner else None,
        is_common=gl.is_common,
        enabled=gl.enabled,
    )

@app.get("/api/lists/")
async def get_lists(current_user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Retourne les listes visibles pour l'utilisateur connecté."""
    result = await db.execute(
        select(GiftList).options(joinedload(GiftList.owner)).where(GiftList.enabled == True)
    )
    all_lists = result.scalars().all()

    visible_lists = []
    for gift_list in all_lists:
        if current_user.is_admin and gift_list.owner_id == current_user.id:
            continue
        if current_user.is_admin and gift_list.is_common:
            continue
        visible_lists.append(_serialize_list(gift_list))

    return visible_lists

@app.get("/api/lists/all/", dependencies=[Depends(require_admin)])
async def get_all_lists(db: AsyncSession = Depends(get_db)):
    """Retourne toutes les listes (admins)."""
    result = await db.execute(select(GiftList).options(joinedload(GiftList.owner)))
    all_lists = result.scalars().all()
    return [_serialize_list(gl) for gl in all_lists]

@app.patch("/api/lists/{slug}/toggle", dependencies=[Depends(require_megaadmin)])
async def toggle_list(slug: str, db: AsyncSession = Depends(get_db)):
    """Active ou désactive une liste (super admin only)."""
    result = await db.execute(select(GiftList).where(GiftList.slug == slug))
    gift_list = result.scalars().first()
    
    if not gift_list:
        raise HTTPException(status_code=404, detail="Liste non trouvée")
    
    # Toggle l'état
    new_enabled = not gift_list.enabled
    stmt = update(GiftList).where(GiftList.slug == slug).values(enabled=new_enabled)
    await db.execute(stmt)
    await db.commit()
    
    return {"success": True, "slug": slug, "enabled": new_enabled}


@app.post("/api/lists/", dependencies=[Depends(require_megaadmin)])
async def create_list_api(data: GiftListCreate, db: AsyncSession = Depends(get_db)):
    if not data.label or not data.label.strip():
        raise HTTPException(status_code=400, detail="Le label est requis")
    if data.owner_id is not None:
        result = await db.execute(select(User).where(User.id == data.owner_id))
        if not result.scalars().first():
            raise HTTPException(status_code=400, detail="Propriétaire introuvable")
        existing = await db.execute(select(GiftList).where(GiftList.owner_id == data.owner_id))
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Ce propriétaire possède déjà une liste")
    slug = await _unique_slug(db, _slugify(data.label))
    new_list = GiftList(slug=slug, label=data.label.strip(), owner_id=data.owner_id, is_common=False, enabled=True)
    db.add(new_list)
    await db.commit()
    return {"success": True, "slug": slug}


@app.patch("/api/lists/{slug}", dependencies=[Depends(require_megaadmin)])
async def update_list_api(slug: str, data: GiftListUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GiftList).where(GiftList.slug == slug))
    gift_list = result.scalars().first()
    if not gift_list:
        raise HTTPException(status_code=404, detail="Liste non trouvée")
    sent = data.model_dump(exclude_unset=True)
    values = {}
    if "label" in sent:
        if not sent["label"] or not sent["label"].strip():
            raise HTTPException(status_code=400, detail="Le label est requis")
        values["label"] = sent["label"].strip()
    if "owner_id" in sent:
        new_owner = sent["owner_id"]
        if new_owner is not None:
            result_u = await db.execute(select(User).where(User.id == new_owner))
            if not result_u.scalars().first():
                raise HTTPException(status_code=400, detail="Propriétaire introuvable")
            existing = await db.execute(
                select(GiftList).where(GiftList.owner_id == new_owner, GiftList.slug != slug)
            )
            if existing.scalars().first():
                raise HTTPException(status_code=400, detail="Ce propriétaire possède déjà une liste")
        values["owner_id"] = new_owner
    if values:
        await db.execute(update(GiftList).where(GiftList.slug == slug).values(**values))
        await db.commit()
    return {"success": True}


@app.delete("/api/lists/{slug}", dependencies=[Depends(require_megaadmin)])
async def delete_list_api(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GiftList).where(GiftList.slug == slug))
    gift_list = result.scalars().first()
    if not gift_list:
        raise HTTPException(status_code=404, detail="Liste non trouvée")
    ideas = (await db.execute(select(Idea).where(Idea.list_id == gift_list.id))).scalars().all()
    # NB: les suppressions d'images ne sont pas transactionnelles avec le commit DB (limite FS).
    for idea in ideas:
        remove_image(idea.id)
    await db.execute(delete(Idea).where(Idea.list_id == gift_list.id))
    await db.execute(delete(GiftList).where(GiftList.id == gift_list.id))
    await db.commit()
    return {"success": True}


# ─── Kdos Endpoints ─────────────────────────────────────────────────────

@app.get("/api/kdos/")
async def get_kdo_list(user: str = "all", list: str = None, current_user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user_owner = aliased(User)
    user_taker = aliased(User)
    
    base_select = select(
        Idea.id,
        Idea.name,
        Idea.comment,
        Idea.price,
        Idea.url,
        Idea.imageDisplay,
        Idea.availability,
        Idea.userId,
        user_owner.name.label("user"),
        Idea.takenById,
        user_taker.name.label("takenBy")
    ).outerjoin(user_owner, Idea.userId == user_owner.id) \
    .outerjoin(user_taker, Idea.takenById == user_taker.id)

    if current_user.is_admin:
        query = base_select.filter(or_(Idea.userId != current_user.id, Idea.userId == None))
    else:
        query = base_select

    # Filtre par slug de liste
    if list:
        result_list = await db.execute(select(GiftList).where(GiftList.slug == list))
        gift_list = result_list.scalars().first()
        if not gift_list:
            raise HTTPException(status_code=404, detail="Liste non trouvée")
        query = query.filter(Idea.list_id == gift_list.id)
    elif user != "all":
        # Rétrocompatibilité : filtre par nom d'utilisateur
        result = await db.execute(select(User).where(User.name == user))
        user_instance = result.scalars().first()
        if not user_instance:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        query = query.filter(Idea.userId == user_instance.id)

    result = await db.execute(query)

    rows = result.mappings().all()

    return rows

@app.get("/api/kdos-admin/", dependencies=[Depends(require_admin)])
async def get_kdo_list_admin(user: str = "all", list: str = None, db: AsyncSession = Depends(get_db)):
    user_owner = aliased(User)
    query = select(
        Idea.id,
        Idea.name,
        Idea.comment,
        Idea.price,
        Idea.url,
        Idea.image,
        Idea.imageDisplay,
        Idea.userId,
        user_owner.name.label("user"),
    ).outerjoin(user_owner, Idea.userId == user_owner.id)

    # Support pour le nouveau paramètre list (slug de la liste)
    if list:
        result_list = await db.execute(select(GiftList).where(GiftList.slug == list))
        gift_list = result_list.scalars().first()
        if not gift_list:
            raise HTTPException(status_code=404, detail="Liste non trouvée")
        query = query.filter(Idea.list_id == gift_list.id)
    elif user != "all":
        # Rétrocompatibilité
        result = await db.execute(select(User).where(User.name == user))
        user_instance = result.scalars().first()
        if not user_instance:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        query = query.filter(Idea.userId == user_instance.id)

    result = await db.execute(query)
    rows = result.mappings().all()
    return rows


@app.post("/api/login/")
async def login_api(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # Chercher l'utilisateur par username
    result = await db.execute(select(User).filter(User.name == form_data.username))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Vérifier le mot de passe
    valid, new_hash = verify_and_update_password(form_data.password, user.password)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if new_hash:
        user.password = new_hash
        stmt = (
            update(User)
            .where(User.id == user.id)
            .values(password=new_hash)
        )
        await db.execute(stmt)
        await db.commit()
    
    # Générer un Access Token et un Refresh Token
    access_token = create_access_token({"sub": str(user.id), "username": user.name, "isAdmin": user.isAdmin, "isMegaAdmin": user.isMegaAdmin})
    refresh_token,expire = create_refresh_token({"sub": str(user.id)})
    new_refresh_token = RefreshToken(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=expire
    )
    db.add(new_refresh_token)
    await db.commit()
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "isAdmin": user.isAdmin, "username": user.name, "isMegaAdmin": user.isMegaAdmin, "firstConnection": user.firstConnection}

@app.post("/api/refresh/")
async def refresh_token(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    refresh_token = data.refresh_token
    payload = decode_jwt_of_type(refresh_token, "refresh")
    try:
        user_id = int(payload.get("sub")) if payload else None
    except (TypeError, ValueError):
        user_id = None

    if user_id is None:
        # Jeton invalide, expiré, de mauvais type (ex. ancien jeton sans claim type) ou mal formé :
        # on le supprime de la DB s'il y est.
        await db.execute(delete(RefreshToken).where(RefreshToken.refresh_token == refresh_token))
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh Token invalide ou expiré"
        )

    # Vérifier que le token existe bien en DB pour s'assurer qu'il n'a pas été révoqué.
    result = await db.execute(select(RefreshToken).filter(RefreshToken.refresh_token == refresh_token))
    if not result.scalars().first():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh Token non reconnu")

    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur non trouvé")

    new_access_token = create_access_token({
        "sub": str(user.id),
        "username": user.name,
        "isAdmin": user.isAdmin,
        "isMegaAdmin": user.isMegaAdmin
    })
    new_refresh_token_raw, expire = create_refresh_token({"sub": str(user.id)})

    # Supprimer l'ancien refresh token et les expirés AVANT d'insérer le nouveau :
    # émis dans la même seconde, le nouveau peut être identique à l'ancien (contrainte unique).
    await db.execute(delete(RefreshToken).where(or_(RefreshToken.refresh_token == refresh_token, RefreshToken.expires_at < datetime.now(timezone.utc))))
    db.add(RefreshToken(user_id=user.id, refresh_token=new_refresh_token_raw, expires_at=expire))
    await db.commit()

    return {"access_token": new_access_token, "refresh_token": new_refresh_token_raw, "token_type": "bearer", "isAdmin": user.isAdmin, "username": user.name, "isMegaAdmin": user.isMegaAdmin}


@app.get("/api/test_token/")
def test_token():
    return {"Hello": "World"}

@app.post("/api/add-item/", dependencies=[Depends(require_admin)])
async def add_item_api(idea_data: IdeaCreate, db: AsyncSession = Depends(get_db)):
    # Résoudre l'utilisateur si fourni
    user_id = None
    if idea_data.user:
        result = await db.execute(select(User).where(User.name == idea_data.user))
        user_instance = result.scalars().first()
        if user_instance:
            user_id = user_instance.id

    # Résoudre la liste si fourni
    list_id = None
    if idea_data.list_slug:
        result_list = await db.execute(select(GiftList).where(GiftList.slug == idea_data.list_slug))
        gift_list = result_list.scalars().first()
        if gift_list:
            list_id = gift_list.id
            # Si la liste a un propriétaire, utiliser son id comme userId de l'idée
            if gift_list.owner_id and not user_id:
                user_id = gift_list.owner_id

    url, image, comment = None, None, None
    if idea_data.comment is not None:
        comment=idea_data.comment
    if idea_data.url is not None:
        url=str(idea_data.url)
    if idea_data.image is not None:
        image=str(idea_data.image)


    new_idea = Idea(
        name=idea_data.name,
        comment=comment,
        price=idea_data.price,
        url=url,
        image=image,
        imageDisplay=idea_data.imageDisplay,
        userId=user_id,
        list_id=list_id,
        availability=True,  # Par défaut disponible
        takenById=None,  # Personne ne l'a encore pris
    )

    # Ajouter à la session et commit
    db.add(new_idea)
    await db.commit()
    await db.refresh(new_idea)

    if idea_data.image != "":
        imageDisplay = get_image(idea_data.image, str(new_idea.id) + ".jpg")
        # Mettre à jour la valeur imageDisplay dans la base de données
        stmt = (
            update(Idea)
            .where(Idea.id == new_idea.id)
            .values(imageDisplay=imageDisplay)
        )
        await db.execute(stmt)
        await db.commit()

    return {"success": True, "message": "Idée ajoutée avec succès", "id": new_idea.id}


@app.delete("/api/delete-item/{kdo_pk}/", dependencies=[Depends(require_admin)])
async def delete_item_api(kdo_pk: int, db: AsyncSession = Depends(get_db)):
    # Vérifier si l'idée existe avant de la supprimer
    result = await db.execute(select(Idea).where(Idea.id == kdo_pk))
    idea = result.scalars().first()

    if not idea:
        raise HTTPException(status_code=404, detail="Idée non trouvée")

    # Supprimer l'idée
    stmt = delete(Idea).where(Idea.id == kdo_pk)
    await db.execute(stmt)
    await db.commit()

    # Supprimer l'image associée
    remove_image(kdo_pk)

    return {"success": True, "message": "Idée supprimée avec succès"}


@app.put("/api/modify-item/", dependencies=[Depends(require_admin)])
async def modify_item_api(update_data: IdeaUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Idea).where(Idea.id == update_data.id))
    idea = result.scalars().first()

    if not idea:
        raise HTTPException(status_code=404, detail="Idée non trouvée")
    
    # Créer un dictionnaire avec les valeurs mises à jour
    update_values = update_data.model_dump(exclude_unset=True)  # Exclut les valeurs non envoyées

    # Gérer la mise à jour de la liste / de l'utilisateur
    if update_data.list_slug:
        result_list = await db.execute(select(GiftList).where(GiftList.slug == update_data.list_slug))
        gift_list = result_list.scalars().first()
        if gift_list:
            update_values["list_id"] = gift_list.id
            update_values["userId"] = gift_list.owner_id
    elif update_data.user:
        # Rétrocompatibilité
        result = await db.execute(select(User).where(User.name == update_data.user))
        user_instance = result.scalars().first()
        if not user_instance:
            raise HTTPException(status_code=404, detail="Utilisateur introuvable")
        update_values["userId"] = user_instance.id
    
    # Nettoyer les clés qui ne sont pas dans le modèle Idea
    update_values.pop("list_slug", None)
    update_values.pop("user", None)

    # Convertir les champs url et image en string s'ils sont présents
    if update_values.get("url") is not None:
        update_values["url"] = str(update_values["url"])
    if update_values.get("image") is not None and update_values.get("image") != "":
        new_image_url = str(update_values["image"])
        update_values["image"] = new_image_url

        # Télécharger uniquement si l'URL a changé
        if new_image_url != idea.image:
            update_values["imageDisplay"] = get_image(new_image_url, str(update_data.id) + ".jpg")

    if update_values:  # Vérifie si des modifications ont été faites
        stmt = (
            update(Idea)
            .where(Idea.id == update_data.id)
            .values(**update_values)
        )
        await db.execute(stmt)
        await db.commit()
        return {"success": True, "message": "Idée mise à jour avec succès"}

    return {"success": False, "message": "Aucune modification effectuée"}


def _can_see_idea(idea: Idea, user: CurrentUser) -> bool:
    """On ne réserve que ce qu'on voit : liste active et, pour un admin, ni ses propres idées ni la liste commune."""
    gift_list = idea.gift_list
    if gift_list is not None and not gift_list.enabled:
        return False
    if user.is_admin and (idea.userId == user.id or (gift_list is not None and gift_list.is_common)):
        return False
    return True


async def _get_idea_with_list(db: AsyncSession, kdo_pk: int) -> Idea:
    result = await db.execute(select(Idea).options(joinedload(Idea.gift_list)).where(Idea.id == kdo_pk))
    idea = result.scalars().first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idée non trouvée")
    return idea


@app.post("/api/take-api/{kdo_pk}")
async def take_api(kdo_pk: int, current_user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    idea = await _get_idea_with_list(db, kdo_pk)
    if not _can_see_idea(idea, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non autorisé")

    # Mise à jour conditionnelle : si deux personnes réservent en même temps, une seule gagne
    result = await db.execute(
        update(Idea)
        .where(Idea.id == kdo_pk, Idea.availability == True)
        .values(takenById=current_user.id, availability=False)
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=400, detail="Idée déjà prise")
    return {"success": True, "message": "Idée prise avec succès"}

@app.post("/api/untake-api/{kdo_pk}")
async def untake_api(kdo_pk: int, current_user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    idea = await _get_idea_with_list(db, kdo_pk)
    if idea.availability:
        raise HTTPException(status_code=400, detail="Idée déjà libérée")

    # Celui qui a réservé peut libérer ; un admin aussi, sur une idée qu'il voit
    is_taker = idea.takenById == current_user.id
    if not is_taker and not (current_user.is_admin and _can_see_idea(idea, current_user)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non autorisé")

    # Ne libère que si la réservation n'a pas changé entre-temps
    result = await db.execute(
        update(Idea)
        .where(Idea.id == kdo_pk, Idea.availability == False, Idea.takenById == idea.takenById)
        .values(takenById=None, availability=True)
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=400, detail="Idée déjà libérée")
    return {"success": True, "message": "Idée libérée avec succès"}

@app.api_route("/api/users/", methods=["GET"], dependencies=[Depends(require_megaadmin)])
async def get_username_api(request: Request, db: AsyncSession = Depends(get_db)):
    if request.method == "GET":
        # Récupérer tous les utilisateurs
        result = await db.execute(select(User.id, User.name, User.isAdmin, User.isMegaAdmin).order_by(User.name))
        
        return result.mappings().all()
    
@app.patch("/api/modify-password-admin/{user_id}", dependencies=[Depends(require_megaadmin)])
async def modify_password_api_admin(user_id: int, payload: PasswordChange, db: AsyncSession = Depends(get_db)):
    # Vérifier si l'utilisateur existe
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    # Mettre à jour le mot de passe
    hashed_password = hash_password(payload.password)
    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(password=hashed_password, firstConnection=True)
    )
    await db.execute(stmt)
    await db.commit()

    return {"success": True, "message": "Mot de passe mis à jour avec succès"}

@app.post("/api/modify-password/")
async def modify_password_api(payload: PasswordChange, current_user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user_id = current_user.id

    # Vérifier si l'utilisateur existe
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not payload.firstConnection:
        if not user or not verify_password(payload.currentPassword, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Le mot de passe actuel est incorrect",
            )
    elif not user or not user.firstConnection:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ce n'est pas votre première connexion. Vous n'êtes pas autorisé à changer le mot de passe de cette façon.",
        )
    
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    if payload.password != payload.passwordConfirmation:
        raise HTTPException(status_code=400, detail="Les mots de passe ne correspondent pas")

    # Mettre à jour le mot de passe
    hashed_password = hash_password(payload.password)

    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(password=hashed_password, firstConnection=False)
    )
    await db.execute(stmt)
    await db.commit()

    return {"success": True, "message": "Mot de passe mis à jour avec succès"}

@app.delete("/api/delete-user/{user_id}", dependencies=[Depends(require_megaadmin)])
async def delete_user_api(user_id: int, db: AsyncSession = Depends(get_db)):
    # Vérifier si l'utilisateur existe
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    stmt = update(Idea).where(Idea.takenById == user_id).values(takenById=None, availability=True)
    await db.execute(stmt)
    await db.commit()

    stmt = delete(RefreshToken).where(RefreshToken.user_id == user_id)
    await db.execute(stmt)
    await db.commit()

    # Supprimer l'utilisateur
    stmt = delete(User).where(User.id == user_id)
    await db.execute(stmt)
    await db.commit()

    return {"success": True, "message": "Utilisateur supprimé avec succès"}

@app.post("/api/create-user/", dependencies=[Depends(require_megaadmin)])
async def create_user_api(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Vérifier si l'utilisateur existe déjà
    result = await db.execute(select(User).where(User.name == user_data.name))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Nom d'utilisateur déjà pris")

    # Créer un nouvel utilisateur
    hashed_password = hash_password(user_data.password)
    new_user = User(
        name=user_data.name,
        password=hashed_password,
        isAdmin=user_data.isAdmin,
    )

    # Ajouter à la session et commit
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {"success": True, "message": "Utilisateur créé avec succès", "id": new_user.id}

@app.patch("/api/users/{user_id}/role")
async def update_user_role_api(user_id: int, data: RoleUpdate, current_user: CurrentUser = Depends(require_megaadmin), db: AsyncSession = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas modifier votre propre rôle")
    result = await db.execute(select(User).where(User.id == user_id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    await db.execute(update(User).where(User.id == user_id).values(isAdmin=data.isAdmin))
    await db.commit()
    return {"success": True, "isAdmin": data.isAdmin}

# ─── Settings Endpoints ─────────────────────────────────────────────────

THEME_KEY = "theme"

@app.get("/api/settings/theme", response_model=ThemeResponse)
async def get_theme_api(db: AsyncSession = Depends(get_db)):
    """Thème courant. Public : la page de connexion est thémée."""
    try:
        setting = await db.get(AppSetting, THEME_KEY)
    except SQLAlchemyError:
        # Table absente (migration pas encore lancée) ou base indisponible : on ne casse pas le rendu
        logger.warning("Lecture du thème impossible, repli sur '%s'", DEFAULT_THEME, exc_info=True)
        await db.rollback()
        return {"theme": DEFAULT_THEME}
    if setting is None or setting.value not in THEME_NAMES:
        return {"theme": DEFAULT_THEME}
    return {"theme": setting.value}

@app.put("/api/settings/theme", response_model=ThemeResponse, dependencies=[Depends(require_megaadmin)])
async def update_theme_api(data: ThemeUpdate, db: AsyncSession = Depends(get_db)):
    """Change le thème de l'application (super admin uniquement)."""
    setting = await db.get(AppSetting, THEME_KEY)
    if setting is None:
        db.add(AppSetting(key=THEME_KEY, value=data.theme))
    else:
        setting.value = data.theme
    await db.commit()
    return {"theme": data.theme}

@app.get("/api/auth/")
def auth():
    return {"Hello": "World"}

@app.get("/api/kdos/{filename:path}")
async def fetch_image(
    filename: str,
    w: int | None = Query(None, ge=1),   # largeur demandée (optionnel)
    q: int | None = Query(None, ge=1, le=100),  # qualité demandée (optionnel)
):
    """
    Sert le fichier original /shared/kdos/<filename>
    Les query‑params ?w=…&q=… sont simplement ignorés
    (c’est Next qui fera la mise à l’échelle/compression).
    """
    # Sécurité : empêche les chemins "../../"
    if ".." in filename or filename.startswith("/"):
        raise HTTPException(400, "Chemin invalide")

    base_dir = KDOS_DIR
    # Défense en profondeur : realpath résout aussi les symlinks,
    # le chemin final doit rester sous base_dir
    real_base = os.path.realpath(base_dir)
    full_path = os.path.realpath(os.path.join(base_dir, filename))
    if not full_path.startswith(real_base + os.sep):
        raise HTTPException(400, "Chemin invalide")
    image_path = Path(full_path)
    if not image_path.is_file():
        raise HTTPException(404, "Image non trouvée")

    return FileResponse(
        path=image_path,
        media_type="image/jpeg",
        filename=image_path.name,
    )

@app.get("/api/export-csv/", dependencies=[Depends(require_admin)])
async def export_ideas_csv(db: AsyncSession = Depends(get_db)):
    user_owner = aliased(User)
    query = select(
        Idea.name,
        Idea.url,
        user_owner.name.label("user")
    ).join(user_owner, Idea.userId == user_owner.id)

    result = await db.execute(query)
    rows = result.mappings().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Nom de l'idée", "URL", "Pour qui"])

    for row in rows:
        writer.writerow([row["name"], row["url"] or "", row["user"]])

    csv_content = output.getvalue()
    output.close()

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ideas_export.csv"}
    )