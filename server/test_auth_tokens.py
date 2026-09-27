from datetime import datetime, timedelta, timezone

import jwt

from auth import create_access_token, create_refresh_token, decode_jwt, decode_jwt_of_type
from config import SECRET_KEY, ALGORITHM


def test_access_token_has_access_type():
    token = create_access_token({"sub": "1"})
    assert decode_jwt(token)["type"] == "access"


def test_refresh_token_has_refresh_type():
    token, _ = create_refresh_token({"sub": "1"})
    assert decode_jwt(token)["type"] == "refresh"


def test_decode_jwt_of_type_accepts_matching_type():
    token = create_access_token({"sub": "1"})
    payload = decode_jwt_of_type(token, "access")
    assert payload is not None
    assert payload["sub"] == "1"


def test_decode_jwt_of_type_rejects_other_type():
    refresh, _ = create_refresh_token({"sub": "1"})
    access = create_access_token({"sub": "1"})
    assert decode_jwt_of_type(refresh, "access") is None
    assert decode_jwt_of_type(access, "refresh") is None


def test_decode_jwt_of_type_rejects_token_without_type():
    exp = datetime.now(timezone.utc) + timedelta(minutes=5)
    legacy = jwt.encode({"sub": "1", "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)
    assert decode_jwt_of_type(legacy, "access") is None
    assert decode_jwt_of_type(legacy, "refresh") is None


def test_decode_jwt_of_type_rejects_garbage():
    assert decode_jwt_of_type("pas-un-jwt", "access") is None


def test_refresh_tokens_are_unique_within_the_same_second():
    first, _ = create_refresh_token({"sub": "1"})
    second, _ = create_refresh_token({"sub": "1"})
    assert first != second
