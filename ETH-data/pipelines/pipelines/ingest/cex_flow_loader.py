from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from pathlib import Path

from pipelines.config import get_settings
from pipelines.ingest.common import parse_decimal, parse_iso_date


@dataclass(frozen=True)
class CexFlowRow:
    flow_date: date
    asset: str
    direction: str
    transfer_count: int
    total_volume_native: Decimal
    total_volume_usd: Decimal


class MissingCexFlowDataError(RuntimeError):
    """Raised when the expected Dune export is missing."""


def load_cex_flow_rows() -> list[CexFlowRow]:
    settings = get_settings()
    path = Path(settings.cex_flow_csv)
    if not path.exists():
        raise MissingCexFlowDataError(
            f"Expected CEX flow CSV at {path}. Fetch the Dune query export first."
        )

    rows: list[CexFlowRow] = []
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            rows.append(
                CexFlowRow(
                    flow_date=parse_iso_date(row["flow_date"]),
                    asset=row["asset"],
                    direction=row["direction"],
                    transfer_count=int(row["transfer_count"]),
                    total_volume_native=parse_decimal(row["total_volume_native"]),
                    total_volume_usd=parse_decimal(row["total_volume_usd"]),
                )
            )
    return rows
