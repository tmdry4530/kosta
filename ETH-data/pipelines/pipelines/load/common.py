from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from sqlalchemy import text
from sqlalchemy.engine import Engine


def upsert_rows(engine: Engine, sql: str, rows: Sequence[dict[str, Any]]) -> None:
    if not rows:
        return
    with engine.begin() as connection:
        connection.execute(text(sql), rows)
