from __future__ import annotations
from datetime import datetime
from typing import Optional, List as TypingList
from sqlalchemy import DateTime, ForeignKey, Integer, String, Float, Boolean
from sqlalchemy.orm import relationship, mapped_column, Mapped
from database import Base  # On suppose que Base est défini dans database.py
from pydantic import BaseModel, Field, HttpUrl, validator
import re

class GiftList(Base):
    __tablename__ = "gift_lists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)  # "marie-eve", "mathieu", "commune"
    label: Mapped[str] = mapped_column(String, nullable=False)  # "Marie-Eve", "Mathieu", "Liste commune"
    owner_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)  # NULL = giftee sans compte
    is_common: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)  # True = unique liste commune
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    owner: Mapped[Optional["User"]] = relationship("User", foreign_keys=[owner_id])
    ideas: Mapped[list[Idea]] = relationship(
        "Idea",
        back_populates="gift_list",
        foreign_keys=lambda: [Idea.list_id]
    )

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    isAdmin: Mapped[bool] = mapped_column(Boolean, default=False)
    isMegaAdmin: Mapped[bool] = mapped_column(Boolean, default=False)
    firstConnection: Mapped[bool] = mapped_column(Boolean, default=True)
    ideas: Mapped[list[Idea]] = relationship(
        "Idea",
        back_populates="user",
        foreign_keys=lambda: [Idea.userId]
    )
    take: Mapped[list[Idea]] = relationship(
        "Idea",
        back_populates="takenBy",
        foreign_keys=lambda: [Idea.takenById]
    )
    token: Mapped[RefreshToken] = relationship(
        "RefreshToken",
        back_populates="user",
        uselist=False
    )

class Idea(Base):
    __tablename__ = "ideas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    comment: Mapped[str] = mapped_column(String)
    # Utiliser "users.id" (note le 's') pour la FK
    userId: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    user: Mapped[Optional[User]] = relationship(
        "User",
        foreign_keys=[userId],
        back_populates="ideas"
    )
    list_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("gift_lists.id"), nullable=True)
    gift_list: Mapped[Optional[GiftList]] = relationship(
        "GiftList",
        foreign_keys=[list_id],
        back_populates="ideas"
    )
    availability: Mapped[bool] = mapped_column(Boolean, default=True)
    takenById: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    takenBy: Mapped[Optional[User]] = relationship(
        "User",
        foreign_keys=[takenById],
        back_populates="take"
    )
    price: Mapped[float] = mapped_column(Float)
    url: Mapped[str] = mapped_column(String)
    image: Mapped[str] = mapped_column(String)
    imageDisplay: Mapped[str] = mapped_column(String, default="unknown.jpg", nullable=False)

class IdeaCreate(BaseModel):
    name: str
    comment: Optional[str] = None
    price: Optional[float] = None
    url: Optional[HttpUrl] = None
    image: Optional[str] = None
    imageDisplay: Optional[str] = "unknown.jpg"
    user: Optional[str] = None
    list_slug: Optional[str] = None  # slug de la liste cible

class IdeaUpdate(BaseModel):
    id: int
    name: Optional[str] = None
    comment: Optional[str] = None
    price: Optional[float] = None
    url: Optional[HttpUrl] = None
    image: Optional[str] = None
    imageDisplay: Optional[str] = None
    user: Optional[str] = None
    list_slug: Optional[str] = None

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # Référence correcte à "users.id"
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    user: Mapped[User] = relationship("User", back_populates="token")
    refresh_token: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class PasswordChange(BaseModel):
    password: str
    currentPassword: Optional[str] = None
    passwordConfirmation: Optional[str] = None
    firstConnection: Optional[bool] = None

    @validator('password')
    def check_password_complexity(cls, v: str) -> str:
        # 1. Longueur minimale
        if len(v) < 8:
            raise ValueError('Le mot de passe doit contenir au moins 8 caractères.')
        # 2. Au moins une majuscule
        if not any(c.isupper() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une lettre majuscule.')
        # 3. Au moins un caractère spécial
        if not re.search(r'[\W_]', v):
            raise ValueError('Le mot de passe doit contenir au moins un caractère spécial.')
        # 4. Au moins un chiffre
        if not any(c.isdigit() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins un chiffre.')
        return v
    
class UserCreate(BaseModel):
    name: str
    password: str

    @validator('name')
    def check_name_length(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError('Le nom d\'utilisateur doit contenir au moins 3 caractères.')
        return v
    @validator('password')
    def check_password_complexity(cls, v: str) -> str:
        # 1. Longueur minimale
        if len(v) < 8:
            raise ValueError('Le mot de passe doit contenir au moins 8 caractères.')
        # 2. Au moins une majuscule
        if not any(c.isupper() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une lettre majuscule.')
        # 3. Au moins un caractère spécial
        if not re.search(r'[\W_]', v):
            raise ValueError('Le mot de passe doit contenir au moins un caractère spécial.')
        # 4. Au moins un chiffre
        if not any(c.isdigit() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins un chiffre.')
        return v

class GiftListResponse(BaseModel):
    slug: str
    label: str
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    is_common: bool
    enabled: bool

    class Config:
        from_attributes = True

class GiftListToggle(BaseModel):
    enabled: bool