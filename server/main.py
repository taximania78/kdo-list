import csv
import io
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, status, Request, Query
from fastapi.responses import FileResponse, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import delete, or_, update
from sqlalchemy.orm import joinedload, aliased
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import Idea, IdeaCreate,IdeaUpdate, RefreshToken, RefreshTokenRequest, User, UserCreate, PasswordChange
from database import get_db
from auth import (
    create_access_token,
    create_refresh_token,
    decode_jwt,
    hash_password,
    verify_password,
    verify_and_update_password,
)
from image import get_image, remove_image
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

# Utilisé pour récupérer le token dans les headers (Bearer <token>)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")


@app.get("/api/kdos/")
async def get_kdo_list(user: str = "all",token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    
    user_owner = aliased(User)
    user_taker = aliased(User)
    if payload.get("isAdmin"):
        query = select(
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
        ).join(user_owner, Idea.userId == user_owner.id) \
        .outerjoin(user_taker, Idea.takenById == user_taker.id) \
        .filter(Idea.userId != int(payload.get("sub")))
    else:
        query = select(
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
        ).join(user_owner, Idea.userId == user_owner.id) \
        .outerjoin(user_taker, Idea.takenById == user_taker.id)

    if user != "all":
            # Récupérer l'instance User correspondant au nom donné
            result = await db.execute(select(User).where(User.name == user))
            user_instance = result.scalars().first()
            if not user_instance:
                raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
            query = query.filter(Idea.userId == user_instance.id)

    result = await db.execute(query)

    rows = result.mappings().all()

    return rows

@app.get("/api/kdos-admin/")
async def get_kdo_list_admin(user: str = "all", token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    
    if payload.get("isAdmin"):
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
        ).join(user_owner, Idea.userId == user_owner.id)

        if user != "all":
            # Récupérer l'instance User correspondant au nom donné
            result = await db.execute(select(User).where(User.name == user))
            user_instance = result.scalars().first()
            if not user_instance:
                raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

            query = query.filter(Idea.userId == user_instance.id)

        result = await db.execute(query)
        rows = result.mappings().all()
        return rows
    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non autorisé")

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
        print('Mise à jour du mot de passe')
    
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
    # Vérifier si le token fourni est valide
    refresh_token = data.refresh_token
    payload = decode_jwt(refresh_token)
    
    if not payload:
        # Si le token est invalide ou expiré, on tente de le supprimer de la DB
        result = await db.execute(select(RefreshToken).filter(RefreshToken.refresh_token == refresh_token))
        expired_token = result.scalars().first()
        if expired_token:
            await db.delete(expired_token)
            await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Refresh Token invalide ou expiré"
        )
    
    # Vérifier que le token existe bien en DB pour s'assurer qu'il n'a pas été révoqué.
    result = await db.execute(select(RefreshToken).filter(RefreshToken.refresh_token == refresh_token))
    valid_token = result.scalars().first()
    if not valid_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh Token non reconnu")
    
    result = await db.execute(select(User).filter(User.id == int(payload.get("sub"))))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur non trouvé")

    # Générer un nouveau access token avec les claims du refresh token
    new_access_token = create_access_token({
        "sub": payload.get("sub"),
        "username": user.name,
        "isAdmin": user.isAdmin,
        "isMegaAdmin": user.isMegaAdmin
    })

    new_refresh_token_raw, expire = create_refresh_token({"sub": str(payload.get("sub"))})

    new_refresh_token = RefreshToken(
        user_id=int(payload.get("sub")),
        refresh_token=new_refresh_token_raw,
        expires_at=expire
    )

    # Supprimer les tokens expirés avant d'exécuter la requête et l'ancien refresh token
    db.add(new_refresh_token)
    await db.execute(delete(RefreshToken).where(or_(RefreshToken.refresh_token == refresh_token,RefreshToken.expires_at < datetime.now(timezone.utc))))
    await db.commit()
    
    return {"access_token": new_access_token, "refresh_token": new_refresh_token_raw, "token_type": "bearer", "isAdmin": payload.get("isAdmin"), "username": payload.get("username"), "isMegaAdmin": payload.get("isMegaAdmin")}

@app.get("/api/test_token/")
def test_token():
    return {"Hello": "World"}

@app.post("/api/add-item/")
async def add_item_api(idea_data: IdeaCreate, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    
    if not payload.get("isAdmin"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non autorisé")
    
    result = await db.execute(select(User).where(User.name == idea_data.user))
    user_instance = result.scalars().first()

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
        userId=user_instance.id,
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


@app.delete("/api/delete-item/{kdo_pk}/")
async def delete_item_api(kdo_pk: int, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    
    if payload.get("isAdmin"):
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
    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non autorisé")

@app.put("/api/modify-item/")
async def modify_item_api(update_data: IdeaUpdate, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    if not payload.get("isAdmin"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non autorisé")
    
    result = await db.execute(select(Idea).where(Idea.id == update_data.id))
    idea = result.scalars().first()

    if not idea:
        raise HTTPException(status_code=404, detail="Idée non trouvée")
    
    result = await db.execute(select(User).where(User.name == update_data.user))
    user_instance = result.scalars().first()
    if not user_instance:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # Créer un dictionnaire avec les valeurs mises à jour
    update_values = update_data.model_dump(exclude_unset=True)  # Exclut les valeurs non envoyées

    # Puis remplace la clé `user` dans update_values par `userId`
    update_values["userId"] = user_instance.id
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


@app.post("/api/take-api/{kdo_pk}")
async def take_api(kdo_pk: int, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    
    # Vérifier si l'objet existe
    result = await db.execute(select(Idea).where(Idea.id == kdo_pk))
    idea = result.scalars().first()
    
    if not idea:
        raise HTTPException(status_code=404, detail="Idée non trouvée")

    if idea.availability == True:
        stmt = (
        update(Idea)
        .where(Idea.id == kdo_pk)
        .values(takenById=int(payload.get("sub")), availability=False)
        )
        await db.execute(stmt)
        await db.commit()
        return {"success": True, "message": "Idée prise avec succès"}
    else:
        raise HTTPException(status_code=400, detail="Idée déjà prise")

@app.post("/api/untake-api/{kdo_pk}")
async def untake_api(kdo_pk: int, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    
    # Vérifier si l'objet existe
    result = await db.execute(select(Idea).where(Idea.id == kdo_pk))
    idea = result.scalars().first()
    
    if not idea:
        raise HTTPException(status_code=404, detail="Idée non trouvée")

    if idea.availability == False:
        stmt = (
        update(Idea)
        .where(Idea.id == kdo_pk)
        .values(takenById=None, availability=True)
        )
        await db.execute(stmt)
        await db.commit()
        return {"success": True, "message": "Idée libérée avec succès"}
    else:
        raise HTTPException(status_code=400, detail="Idée déjà libérée")

@app.api_route("/api/users/", methods=["GET"])
async def get_username_api(request: Request, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_jwt(token)

    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    if not payload.get("isAdmin"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non autorisé")
    
    if request.method == "GET":
        # Récupérer tous les utilisateurs
        result = await db.execute(select(User.id, User.name).order_by(User.name))
        
        return result.mappings().all()
    
@app.patch("/api/modify-password-admin/{user_id}")
async def modify_password_api_admin(user_id: int, payload: PasswordChange, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    verifToken = decode_jwt(token)
    if not verifToken:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    
    if not verifToken.get("isAdmin"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non autorisé")
    
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
async def modify_password_api(payload: PasswordChange, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    verifToken = decode_jwt(token)
    if not verifToken:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    
    user_id= int(verifToken.get("sub"))

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

@app.delete("/api/delete-user/{user_id}")
async def delete_user_api(user_id: int, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    
    if not payload.get("isAdmin"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non autorisé")
    
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

@app.post("/api/create-user/")
async def create_user_api(user_data: UserCreate, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    
    if not payload.get("isAdmin"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non autorisé")
    
    # Vérifier si l'utilisateur existe déjà
    result = await db.execute(select(User).where(User.name == user_data.name))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Nom d'utilisateur déjà pris")

    # Créer un nouvel utilisateur
    hashed_password = hash_password(user_data.password)
    new_user = User(
        name=user_data.name,
        password=hashed_password
    )

    # Ajouter à la session et commit
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {"success": True, "message": "Utilisateur créé avec succès", "id": new_user.id}

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

    if MODE == "production":
        image_path = Path("/shared/kdos") / filename
    else:
        image_path = Path("../kdoapp/public/kdos") / filename
    if not image_path.is_file():
        raise HTTPException(404, "Image non trouvée")

    return FileResponse(
        path=image_path,
        media_type="image/jpeg",
        filename=image_path.name,
    )

@app.get("/api/export-csv/")
async def export_ideas_csv(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")

    if not payload.get("isAdmin"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non autorisé")

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