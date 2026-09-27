from database import build_database_url


def test_database_url_keeps_special_characters_in_password():
    """Un mot de passe contenant @, / ou : ne doit pas casser le découpage de l'URL."""
    url = build_database_url(user="admin", password="p@ss/w:rd", host="db", port="5432", name="kdo")
    assert url.password == "p@ss/w:rd"
    assert url.username == "admin"
    assert url.host == "db"
    assert url.port == 5432
    assert url.database == "kdo"
    assert url.drivername == "postgresql+asyncpg"
