from __future__ import annotations

from collections.abc import Iterable
from dataclasses import asdict, is_dataclass

from pipelines.ingest.cex_flow_loader import CexFlowRow
from pipelines.ingest.price_loader import PriceRow
from pipelines.ingest.whale_csv_loader import WhaleTransferRow
from pipelines.transform.event_windows import EventWindowRow


def _serialize(record: object) -> str:
    if is_dataclass(record):
        return str(asdict(record))  # type: ignore[arg-type]
    return repr(record)


def validate_whale_rows(rows: Iterable[WhaleTransferRow]) -> None:
    for row in rows:
        if row.total_volume_usd < 0:
            raise ValueError(f"Invalid whale row: {_serialize(row)}")
        if row.week_start.year < 2017:
            raise ValueError(f"week_start before 2017: {_serialize(row)}")


def validate_cex_rows(rows: Iterable[CexFlowRow]) -> None:
    for row in rows:
        if row.direction not in {"inflow", "outflow"}:
            raise ValueError(f"Invalid cex direction: {_serialize(row)}")
        if row.total_volume_usd < 0:
            raise ValueError(f"Negative cex volume: {_serialize(row)}")


def validate_price_rows(rows: Iterable[PriceRow]) -> None:
    for row in rows:
        if row.price_usd <= 0:
            raise ValueError(f"Invalid price row: {_serialize(row)}")


def validate_event_windows(rows: Iterable[EventWindowRow]) -> None:
    for row in rows:
        if not -7 <= row.day_offset <= 7:
            raise ValueError(f"Invalid day offset: {_serialize(row)}")
        if row.fear_greed_value is not None and not 0 <= row.fear_greed_value <= 100:
            raise ValueError(f"Invalid fear greed value: {_serialize(row)}")
        expected_date = row.event_date + row.offset_delta
        if row.window_date != expected_date:
            raise ValueError(f"Window date mismatch: {_serialize(row)}")
