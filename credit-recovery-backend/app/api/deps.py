"""
app/api/deps.py

Shared FastAPI dependencies: DB session, authenticated user resolution,
and role-based guards.

Multi-tenancy note: `CurrentUser.business_id` (taken from the signed JWT,
never from a request body/query param) is the single source of truth used
by every route to scope queries. Every service function that touches
`customers` or `transactions` MUST filter by business_id -- this is the
control that prevents one business from ever reading or mutating another
business's data (IDOR / tenant-isolation).
"""
import uuid
from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User, UserRole

_bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: uuid.UUID
    business_id: uuid.UUID
    role: UserRole


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_access_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = uuid.UUID(payload["sub"])

    # Re-check `is_active` against the DB on every request (not just at login
    # time) so disabling a user takes effect immediately, not after their
    # 15-minute access token happens to expire.
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive or no longer exists.",
        )

    return CurrentUser(id=user.id, business_id=user.business_id, role=UserRole(user.role))


def require_roles(*allowed: UserRole):
    """
    Usage: Depends(require_roles(UserRole.owner))
    Phase 1 only ever issues `owner` accounts, but every endpoint is already
    gated so Phase 4 (Staff/Manager) can add permissions without touching
    Phase 1 route signatures.
    """

    def _checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return _checker


require_owner = require_roles(UserRole.owner)