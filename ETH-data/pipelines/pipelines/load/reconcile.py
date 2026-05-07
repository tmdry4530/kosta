from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from sqlalchemy import text
from sqlalchemy.engine import Engine

RowTuple = tuple[Any, ...]


def fetch_rows(engine: Engine, query: str) -> list[RowTuple]:
    with engine.connect() as connection:
        rows = connection.execute(text(query)).all()
    return [tuple(row) for row in rows]


def prune_stale_rows(
    engine: Engine,
    table: str,
    key_columns: tuple[str, ...],
    expected_keys: Sequence[RowTuple],
) -> None:
    select_columns = ", ".join(key_columns)
    actual_keys = set(fetch_rows(engine, f"SELECT {select_columns} FROM {table}"))
    expected_key_set = set(expected_keys)
    stale_keys = actual_keys - expected_key_set
    if not stale_keys:
        return

    where_clause = " AND ".join(f"{column} = :{column}" for column in key_columns)
    delete_sql = text(f"DELETE FROM {table} WHERE {where_clause}")
    payload = [
        {column: key[index] for index, column in enumerate(key_columns)}
        for key in stale_keys
    ]
    with engine.begin() as connection:
        connection.execute(delete_sql, payload)


def assert_rows_match(
    label: str,
    expected_rows: Sequence[RowTuple],
    actual_rows: Sequence[RowTuple],
) -> None:
    expected_sorted = sorted(expected_rows)
    actual_sorted = sorted(actual_rows)
    if expected_sorted != actual_sorted:
        raise ValueError(
            f"{label} mismatch: expected {len(expected_sorted)} rows, got {len(actual_sorted)} rows"
        )
