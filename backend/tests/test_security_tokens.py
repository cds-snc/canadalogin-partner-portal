import sys
from unittest.mock import AsyncMock, patch

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric.ed448 import Ed448PrivateKey
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from jwt.utils import base64url_encode
from pydantic import SecretStr

from src.app.core import security


@pytest.mark.asyncio
@pytest.mark.parametrize("token_type", list(security.TokenType))
async def test_signed_token_round_trip(token_type, mock_db, monkeypatch):
    monkeypatch.setattr(security, "SECRET_KEY", SecretStr("test-signing-key-not-for-production"))
    monkeypatch.setattr(security, "ALGORITHM", "HS256")
    create_token = (
        security.create_access_token
        if token_type == security.TokenType.ACCESS
        else security.create_refresh_token
    )
    token = await create_token({"sub": "test-user"})

    with patch.object(security.crud_token_blacklist, "exists", new=AsyncMock(return_value=False)):
        result = await security.verify_token(token, token_type, mock_db)

    assert result is not None
    assert result.subject == "test-user"


@pytest.mark.asyncio
async def test_token_signed_with_wrong_key_is_rejected(mock_db, monkeypatch):
    monkeypatch.setattr(security, "SECRET_KEY", SecretStr("test-signing-key-not-for-production"))
    monkeypatch.setattr(security, "ALGORITHM", "HS256")
    token = await security.create_access_token({"sub": "test-user"})
    monkeypatch.setattr(security, "SECRET_KEY", SecretStr("different-test-key-not-for-production"))

    with patch.object(security.crud_token_blacklist, "exists", new=AsyncMock(return_value=False)):
        result = await security.verify_token(token, security.TokenType.ACCESS, mock_db)

    assert result is None


@pytest.mark.parametrize("use_jwk_client", [False, True])
def test_recursive_unverified_payload_raises_decode_error(use_jwk_client):
    header = base64url_encode(b'{"alg":"HS256","kid":"test-key"}')
    depth = sys.getrecursionlimit() + 100
    payload = base64url_encode(b"[" * depth + b"]" * depth)
    token = b".".join((header, payload, b"")).decode("ascii")

    with pytest.raises(jwt.DecodeError):
        if use_jwk_client:
            jwt.PyJWKClient("https://example.com/jwks").get_signing_key_from_jwt(token)
        else:
            jwt.decode(token, options={"verify_signature": False})


@pytest.mark.parametrize("key_class", [Ed25519PrivateKey, Ed448PrivateKey])
def test_okp_jwk_rejects_mismatched_public_and_private_keys(key_class):
    private_key = key_class.generate()
    other_key = key_class.generate()
    jwk = jwt.algorithms.OKPAlgorithm.to_jwk(private_key, as_dict=True)

    assert jwt.PyJWK.from_dict(jwk, algorithm="EdDSA").key.public_key() == private_key.public_key()

    jwk["x"] = jwt.algorithms.OKPAlgorithm.to_jwk(other_key, as_dict=True)["x"]

    with pytest.raises(jwt.InvalidKeyError):
        jwt.PyJWK.from_dict(jwk, algorithm="EdDSA")
