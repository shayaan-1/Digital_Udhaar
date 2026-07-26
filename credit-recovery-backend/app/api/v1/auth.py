"""
app/api/v1/auth.py

Cookie strategy:
- Access token: returned in the JSON body. The SPA keeps it in memory
  (NOT localStorage, to limit XSS blast radius) and attaches it as
  `Authorization: Bearer <token>`.
- Refresh token: set as an httpOnly, Secure, SameSite=strict cookie scoped
  to /api/v1/auth so it's invisible to JS and is never sent to unrelated
  routes. Only /auth/refresh and /auth/logout read it.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import DomainError
from app.core.rate_limit import clear_login_rate_limit, enforce_login_rate_limit, enforce_signup_rate_limit
from app.db.session import get_db
from app.schemas.auth import AccessTokenResponse, LoginRequest, SignupRequest
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/api/v1/auth"


def _set_refresh_cookie(response: Response, raw_refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="strict",
        path=REFRESH_COOKIE_PATH,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )


@router.post("/signup", response_model=AccessTokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, response: Response, request: Request, db: Session = Depends(get_db)):
    enforce_signup_rate_limit(request)
    try:
        user = auth_service.signup(db, payload)
        db.flush()
        access_token, raw_refresh = auth_service.issue_token_pair(
            db, user=user, user_agent=request.headers.get("user-agent"), ip_address=request.client.host if request.client else None
        )
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    _set_refresh_cookie(response, raw_refresh)
    return AccessTokenResponse(
        access_token=access_token,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user_id=user.id,
        business_id=user.business_id,
        role=user.role,
    )


@router.post("/login", response_model=AccessTokenResponse)
def login(payload: LoginRequest, response: Response, request: Request, db: Session = Depends(get_db)):
    enforce_login_rate_limit(request, payload.email)
    try:
        user = auth_service.authenticate(db, payload)
        access_token, raw_refresh = auth_service.issue_token_pair(
            db, user=user, user_agent=request.headers.get("user-agent"), ip_address=request.client.host if request.client else None
        )
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    # Only clear the failed-attempt counter once credentials are confirmed
    # valid, so a wrong password doesn't get "forgiven" until it's earned.
    clear_login_rate_limit(payload.email)
    _set_refresh_cookie(response, raw_refresh)
    return AccessTokenResponse(
        access_token=access_token,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user_id=user.id,
        business_id=user.business_id,
        role=user.role,
    )


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(response: Response, request: Request, db: Session = Depends(get_db)):
    raw_refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw_refresh:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided.")

    try:
        access_token, new_raw_refresh, user = auth_service.rotate_refresh_token(
            db,
            raw_refresh_token=raw_refresh,
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else None,
        )
    except DomainError as exc:
        response.delete_cookie(REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    _set_refresh_cookie(response, new_raw_refresh)
    return AccessTokenResponse(
        access_token=access_token,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user_id=user.id,
        business_id=user.business_id,
        role=user.role,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response, request: Request, db: Session = Depends(get_db)):
    raw_refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    if raw_refresh:
        auth_service.revoke_refresh_token(db, raw_refresh_token=raw_refresh)
    response.delete_cookie(REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)
    return Response(status_code=status.HTTP_204_NO_CONTENT)