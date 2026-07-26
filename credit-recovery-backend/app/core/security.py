"""
app/core/config.py

Centralised, typed application configuration.
All settings are loaded from environment variables (see .env.example).
Never hardcode secrets here.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    DATABASE_URL: str

    # JWT / Auth
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # App
    ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000"
    COOKIE_SECURE: bool = False  # set True in production (HTTPS only)

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENV.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    # lru_cache => settings are parsed once per process, not per-request.
    return Settings()  # type: ignore[call-arg]