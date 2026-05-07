from __future__ import annotations

from datetime import date

from sqlalchemy import text
from sqlalchemy.engine import Engine

from pipelines.transform.event_windows import EventRecord


def load_events_for_windows(engine: Engine) -> list[EventRecord]:
    with engine.connect() as connection:
        rows = connection.execute(
            text("SELECT id, event_date FROM events ORDER BY event_date, id")
        ).all()
    return [
        EventRecord(id=row.id, event_date=date.fromisoformat(str(row.event_date)))
        for row in rows
    ]
