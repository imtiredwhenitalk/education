import os
from typing import Optional

from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker


def _normalize_database_url(url: str) -> str:
    url = (url or "").strip()
    if not url:
        return url

    # Render Postgres often requires TLS; psycopg2 uses sslmode=require.
    # If user already provided sslmode, keep it as-is.
    try:
        parsed = urlparse(url)
        if parsed.scheme not in {"postgres", "postgresql"}:
            return url

        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        if "sslmode" in query:
            return url

        host = (parsed.hostname or "").lower()
        is_render_host = (
            host.endswith(".render.com")
            or host.endswith("-postgres.render.com")
            or host.endswith("-postgres.render.com.")
            or "render.com" in host
            or host.startswith("dpg-")
        )

        if not is_render_host:
            return url

        query["sslmode"] = "require"
        new_query = urlencode(query)
        return urlunparse(parsed._replace(query=new_query))
    except Exception:
        # If anything goes wrong, return original value.
        return url


DATABASE_URL = _normalize_database_url(os.getenv("DATABASE_URL", ""))


def postgres_enabled() -> bool:
    return DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://")


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    future=True,
) if postgres_enabled() else None


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    future=True,
) if engine is not None else None


def get_session() -> Session:
    if SessionLocal is None:
        raise RuntimeError("Postgres is not configured. Set DATABASE_URL.")
    return SessionLocal()


def get_database_url() -> Optional[str]:
    return DATABASE_URL or None
