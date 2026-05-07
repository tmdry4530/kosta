from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal


def parse_utc_week(raw: str) -> date:
    return datetime.strptime(raw, "%Y-%m-%d %H:%M:%S.%f UTC").date()


def parse_iso_date(raw: str) -> date:
    return date.fromisoformat(raw)


def parse_decimal(raw: str) -> Decimal:
    return Decimal(raw)
