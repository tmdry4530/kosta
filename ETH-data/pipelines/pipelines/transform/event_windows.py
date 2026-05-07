from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from typing import NamedTuple

from pipelines.ingest.cex_flow_loader import CexFlowRow
from pipelines.ingest.price_loader import PriceRow
from pipelines.ingest.whale_csv_loader import WhaleTransferRow


class EventRecord(NamedTuple):
    id: str
    event_date: date


@dataclass(frozen=True)
class EventWindowRow:
    event_id: str
    day_offset: int
    event_date: date
    window_date: date
    whale_volume_usd: Decimal | None
    cex_inflow_usd: Decimal | None
    cex_outflow_usd: Decimal | None
    eth_price_usd: Decimal | None
    btc_price_usd: Decimal | None
    fear_greed_value: int | None

    @property
    def offset_delta(self) -> timedelta:
        return timedelta(days=self.day_offset)


def build_event_windows(
    events: list[EventRecord],
    whale_rows: list[WhaleTransferRow],
    cex_rows: list[CexFlowRow],
    price_rows: list[PriceRow],
) -> list[EventWindowRow]:
    whale_daily: dict[date, Decimal] = {}
    for whale_row in whale_rows:
        daily_value = whale_row.total_volume_usd / Decimal(7)
        for offset in range(7):
            target_date = whale_row.week_start + timedelta(days=offset)
            whale_daily[target_date] = whale_daily.get(target_date, Decimal("0")) + daily_value

    cex_daily: dict[tuple[date, str], Decimal] = {}
    for cex_row in cex_rows:
        key = (cex_row.flow_date, cex_row.direction)
        cex_daily[key] = cex_daily.get(key, Decimal("0")) + cex_row.total_volume_usd

    price_daily: dict[tuple[date, str], Decimal] = {
        (row.price_date, row.asset): row.price_usd for row in price_rows
    }

    windows: list[EventWindowRow] = []
    for event in events:
        for day_offset in range(-7, 8):
            window_date = event.event_date + timedelta(days=day_offset)
            windows.append(
                EventWindowRow(
                    event_id=event.id,
                    day_offset=day_offset,
                    event_date=event.event_date,
                    window_date=window_date,
                    whale_volume_usd=whale_daily.get(window_date),
                    cex_inflow_usd=cex_daily.get((window_date, "inflow")),
                    cex_outflow_usd=cex_daily.get((window_date, "outflow")),
                    eth_price_usd=price_daily.get((window_date, "ETH")),
                    btc_price_usd=price_daily.get((window_date, "BTC")),
                    fear_greed_value=None,
                )
            )
    return windows
