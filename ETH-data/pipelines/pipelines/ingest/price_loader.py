from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from pathlib import Path

from pipelines.config import get_settings
from pipelines.ingest.common import parse_decimal, parse_iso_date


@dataclass(frozen=True)
class PriceRow:
    price_date: date
    asset: str
    price_usd: Decimal
    volume_usd: Decimal | None
    market_cap_usd: Decimal | None


def _load_price_csv(path: Path, asset: str) -> list[PriceRow]:
    rows: list[PriceRow] = []
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            volume = row.get("volume")
            market_cap = row.get("market_cap")
            rows.append(
                PriceRow(
                    price_date=parse_iso_date(row["date"]),
                    asset=asset,
                    price_usd=parse_decimal(row["price"]),
                    volume_usd=parse_decimal(volume) if volume else None,
                    market_cap_usd=parse_decimal(market_cap) if market_cap else None,
                )
            )
    return rows


def load_price_rows() -> list[PriceRow]:
    settings = get_settings()
    return _load_price_csv(settings.eth_price_csv, "ETH") + _load_price_csv(
        settings.btc_price_csv, "BTC"
    )
