import pytest
from pydantic import ValidationError
from models import PasswordChange, UserCreate

def test_password_change_complexity():
    # Mots de passe valides
    valid_passwords = [
        "Complex@123",
        "Valid-Pass!8",
        "SuperS3cret!"
    ]
    for pwd in valid_passwords:
        PasswordChange(password=pwd)

    # Erreurs de longueur
    with pytest.raises(ValidationError) as exc_info:
        PasswordChange(password="S@rt1")
    assert "au moins 8 caractères" in str(exc_info.value)

    # Pas de majuscule
    with pytest.raises(ValidationError) as exc_info:
        PasswordChange(password="complex@123")
    assert "au moins une lettre majuscule" in str(exc_info.value)

    # Pas de caractère spécial
    with pytest.raises(ValidationError) as exc_info:
        PasswordChange(password="Complex123")
    assert "au moins un caractère spécial" in str(exc_info.value)

    # Pas de chiffre
    with pytest.raises(ValidationError) as exc_info:
        PasswordChange(password="Complex@Password")
    assert "au moins un chiffre" in str(exc_info.value)

def test_user_create_validation():
    # Utilisateur valide
    UserCreate(name="User", password="Complex@Password1")

    # Nom trop court
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(name="Us", password="Complex@Password1")
    assert "au moins 3 caractères" in str(exc_info.value)
