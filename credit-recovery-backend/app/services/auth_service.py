"""
app/services/auth_service.py

Signup, login, refresh-token rotation and logout. Also See core/security.py for
the cryptographic details and design rationale.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, InactiveUserError, InvalidCredentialsError, NotFoundError
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.business import Business
from app.models.user import RefreshToken, User, UserRole
from app.schemas.auth import LoginRequest, SignupRequest


def signup(db: Session, data: SignupRequest) -> User:
    """Creates a Business + its first Owner user atomically."""
    business = Business(name=data.business_name, currency="PKR")
    db.add(business)
    db.flush()

    user = User(
        business_id=business.id,
        email=data.email.lower(),
        hashed_password=hash_password(data.password),
        role=UserRole.owner.value,
    )
    db.add(user)
    try:
        db.flush()
    except IntegrityError:
        raise ConflictError("An account with this email already exists.")
    return user


def authenticate(db: Session, data: LoginRequest) -> User:
    user = db.execute(select(User).where(User.email == data.email.lower())).scalar_one_or_none()
    # Constant-shape response whether the email exists or not, to avoid
    # leaking which emails are registered (user enumeration).
    if user is None or not verify_password(data.password, user.hashed_password):
        raise InvalidCredentialsError()
    if not user.is_active:
        raise InactiveUserError()
    return user


def issue_token_pair(
    db: Session, *, user: User, user_agent: str | None, ip_address: str | None
) -> tuple[str, str]:
    """Returns (access_token, raw_refresh_token)."""
    access_token = create_access_token(user_id=str(user.id), business_id=str(user.business_id), role=user.role)

    raw_refresh, refresh_hash, expires_at = generate_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
    )
    db.flush()
    return access_token, raw_refresh


def rotate_refresh_token(
    db: Session, *, raw_refresh_token: str, user_agent: str | None, ip_address: str | None
) -> tuple[str, str, User]:
    """
    Validates + rotates a refresh token. Returns (new_access_token,
    new_raw_refresh_token, user). Implements reuse detection: presenting an
    already-revoked token revokes every other active token for that user,
    since it indicates the token chain has likely been compromised.
    """
    token_hash = hash_refresh_token(raw_refresh_token)
    stored = db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash)).scalar_one_or_none()

    if stored is None:
        raise InvalidCredentialsError()

    if stored.revoked_at is not None:
        _revoke_all_tokens_for_user(db, stored.user_id)
        raise ConflictError("This session was already used or has been revoked. Please log in again.")

    if stored.expires_at < datetime.now(timezone.utc):
        raise InvalidCredentialsError()

    user = db.get(User, stored.user_id)
    if user is None or not user.is_active:
        raise InactiveUserError()

    # Rotate: revoke the presented token, mint a fresh pair.
    stored.revoked_at = datetime.now(timezone.utc)
    new_access, new_raw_refresh = issue_token_pair(db, user=user, user_agent=user_agent, ip_address=ip_address)

    new_hash = hash_refresh_token(new_raw_refresh)
    new_token_row = db.execute(select(RefreshToken).where(RefreshToken.token_hash == new_hash)).scalar_one_or_none()
    if new_token_row is not None:
        stored.replaced_by_id = new_token_row.id

    return new_access, new_raw_refresh, user


def revoke_refresh_token(db: Session, *, raw_refresh_token: str) -> None:
    token_hash = hash_refresh_token(raw_refresh_token)
    stored = db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash)).scalar_one_or_none()
    if stored is not None and stored.revoked_at is None:
        stored.revoked_at = datetime.now(timezone.utc)


def _revoke_all_tokens_for_user(db: Session, user_id: uuid.UUID) -> None:
    now = datetime.now(timezone.utc)
    for token in db.execute(
        select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
    ).scalars():
        token.revoked_at = now