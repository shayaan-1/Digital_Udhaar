"""
app/db/session.py

Engine + session factory, and the FastAPI `get_db` dependency.

Transaction lifecycle:
- One SQLAlchemy Session == one DB transaction per request.
- The dependency commits automatically if the request handler completes
  without raising, and rolls back otherwise. This means route handlers and
  services should NOT call db.commit() themselves (services may use
  db.flush() / db.begin_nested() where they need visibility of an insert's
  server-generated defaults or need a SAVEPOINT for idempotency handling).
- pool_pre_ping avoids "server closed the connection unexpectedly" errors
  after long idle periods (common with managed Postgres).
"""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()