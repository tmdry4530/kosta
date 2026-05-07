from __future__ import annotations

from functools import lru_cache

from sqlalchemy import Engine, create_engine

from pipelines.config import get_settings


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    settings = get_settings()
    return create_engine(settings.database_url, future=True)
