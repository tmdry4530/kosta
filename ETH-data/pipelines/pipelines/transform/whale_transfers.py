from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from pipelines.ingest.whale_csv_loader import WhaleTransferRow


@dataclass
class WhaleAccumulator:
    week_start: date
    asset: str
    transfer_count: int
    total_volume_native: Decimal
    total_volume_usd: Decimal


def normalize_whale_rows(rows: list[WhaleTransferRow]) -> list[WhaleTransferRow]:
    grouped_rows: dict[tuple[date, str], WhaleAccumulator] = {}
    for row in rows:
        if row.week_start < date(2017, 1, 1):
            continue
        key = (row.week_start, row.asset)
        if key not in grouped_rows:
            grouped_rows[key] = WhaleAccumulator(
                week_start=row.week_start,
                asset=row.asset,
                transfer_count=0,
                total_volume_native=Decimal("0"),
                total_volume_usd=Decimal("0"),
            )
        accumulator = grouped_rows[key]
        accumulator.transfer_count += row.transfer_count
        accumulator.total_volume_native += row.total_volume_native
        accumulator.total_volume_usd += row.total_volume_usd

    normalized_rows = [
        WhaleTransferRow(
            week_start=value.week_start,
            asset=value.asset,
            transfer_count=value.transfer_count,
            total_volume_native=value.total_volume_native,
            total_volume_usd=value.total_volume_usd,
            unique_senders=None,
            unique_receivers=None,
        )
        for value in grouped_rows.values()
    ]
    return sorted(normalized_rows, key=lambda row: (row.week_start, row.asset))
