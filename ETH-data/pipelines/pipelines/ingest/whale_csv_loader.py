from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from glob import glob
from pathlib import Path

from pipelines.config import get_settings
from pipelines.ingest.common import parse_decimal, parse_utc_week


@dataclass(frozen=True)
class WhaleTransferRow:
    week_start: date
    asset: str
    transfer_count: int
    total_volume_native: Decimal
    total_volume_usd: Decimal
    unique_senders: int | None
    unique_receivers: int | None


def load_whale_transfer_rows() -> list[WhaleTransferRow]:
    settings = get_settings()
    rows: list[WhaleTransferRow] = []
    for file_name in sorted(glob(settings.whale_glob)):
        with Path(file_name).open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                rows.append(
                    WhaleTransferRow(
                        week_start=parse_utc_week(row["tx_week"]),
                        asset=row["asset"],
                        transfer_count=int(row["whale_tx_count"]),
                        total_volume_native=parse_decimal(row["total_amount"]),
                        total_volume_usd=parse_decimal(row["total_usd_volume"]),
                        unique_senders=None,
                        unique_receivers=None,
                    )
                )
    return rows
