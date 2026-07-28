"""
app/core/security.py

Password hashing and JWT issuing/verification.

Design notes:
- Access tokens are short-lived (15 min default), stateless, sent as a Bearer
  token and used for every authenticated API call.
- Refresh tokens are long-lived, opaque to the client (random string, NOT a
  JWT), and stored server-side ONLY as a SHA-256 hash (see models.user.RefreshToken).
  This lets us revoke individual sessions and detect refresh-token reuse
  (a strong signal of token theft) without ever storing the raw secret.
- Refresh tokens are delivered exclusively via httpOnly, Secure, SameSite=strict
  cookies -> not reachable by JavaScript, mitigating XSS token theft.
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

# bcrypt with automatic per-hash salt; cost factor 12 (default) balances
# security vs. login latency. Bump to 13/14 as hardware improves.
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TOKEN_TYPE_ACCESS = "access"


def hash_password(plain_password: str) -> str:
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return _pwd_context.verify(plain_password, hashed_password)


def create_access_token(*, user_id: str, business_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": user_id,
        "business_id": business_id,
        "role": role,
        "type": TOKEN_TYPE_ACCESS,
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Raises jose.JWTError on any invalid/expired/tampered token."""
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    if payload.get("type") != TOKEN_TYPE_ACCESS:
        raise JWTError("Invalid token type")
    return payload


def generate_refresh_token() -> tuple[str, str, datetime]:
    """
    Returns (raw_token_to_send_to_client, sha256_hash_to_store_in_db, expires_at).
    The raw token is a high-entropy random string - never store it as-is.
    """
    raw_token = secrets.token_urlsafe(64)
    token_hash = hash_refresh_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return raw_token, token_hash, expires_at


def hash_refresh_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()