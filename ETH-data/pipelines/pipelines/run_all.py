from __future__ import annotations

from collections.abc import Sequence
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.engine import Engine

from pipelines.config import get_settings
from pipelines.db import get_engine
from pipelines.ingest.cex_flow_loader import CexFlowRow, load_cex_flow_rows
from pipelines.ingest.price_loader import PriceRow, load_price_rows
from pipelines.ingest.whale_csv_loader import WhaleTransferRow, load_whale_transfer_rows
from pipelines.load.cex_flows import load_cex_flows
from pipelines.load.event_windows import load_event_windows
from pipelines.load.events import load_events_for_windows
from pipelines.load.prices import load_prices
from pipelines.load.reconcile import assert_rows_match, fetch_rows, prune_stale_rows
from pipelines.load.whale_transfers import load_whale_transfers
from pipelines.transform.cex_direction import normalize_cex_rows
from pipelines.transform.event_windows import EventWindowRow, build_event_windows
from pipelines.transform.validators import (
    validate_cex_rows,
    validate_event_windows,
    validate_price_rows,
    validate_whale_rows,
)
from pipelines.transform.whale_transfers import normalize_whale_rows


def quantize_decimal(value: Decimal | None, exponent: str) -> Decimal | None:
    if value is None:
        return None
    return value.quantize(Decimal(exponent), rounding=ROUND_HALF_UP)


def write_counts_snapshot(engine: Engine) -> None:
    settings = get_settings()
    settings.processed_dir.mkdir(parents=True, exist_ok=True)
    output_path = Path(settings.processed_dir / "table_counts.txt")
    query = text(
        """
        SELECT 'whale_transfers' AS table_name, count(*)::text AS row_count FROM whale_transfers
        UNION ALL SELECT 'cex_flows', count(*)::text FROM cex_flows
        UNION ALL SELECT 'prices', count(*)::text FROM prices
        UNION ALL SELECT 'event_windows', count(*)::text FROM event_windows
        ORDER BY table_name
        """
    )
    with engine.connect() as connection:
        rows = connection.execute(query).all()
    output_path.write_text("\n".join(f"{row.table_name}={row.row_count}" for row in rows) + "\n")


def verify_persisted_state(
    engine: Engine,
    whale_rows: Sequence[WhaleTransferRow],
    cex_rows: Sequence[CexFlowRow],
    price_rows: Sequence[PriceRow],
    event_windows: Sequence[EventWindowRow],
) -> None:
    whale_expected = [
        (
            row.week_start,
            row.asset,
            row.transfer_count,
            quantize_decimal(row.total_volume_native, "0.00000001"),
            quantize_decimal(row.total_volume_usd, "0.01"),
        )
        for row in whale_rows
    ]
    prune_stale_rows(
        engine,
        "whale_transfers",
        ("week_start", "asset"),
        [(row.week_start, row.asset) for row in whale_rows],
    )
    whale_actual = fetch_rows(
        engine,
        """
        SELECT week_start, asset, transfer_count, total_volume_native, total_volume_usd
        FROM whale_transfers
        """,
    )
    assert_rows_match("whale_transfers", whale_expected, whale_actual)

    cex_expected = [
        (
            row.flow_date,
            row.asset,
            row.direction,
            row.transfer_count,
            quantize_decimal(row.total_volume_native, "0.00000001"),
            quantize_decimal(row.total_volume_usd, "0.01"),
        )
        for row in cex_rows
    ]
    prune_stale_rows(
        engine,
        "cex_flows",
        ("flow_date", "asset", "direction"),
        [(row.flow_date, row.asset, row.direction) for row in cex_rows],
    )
    cex_actual = fetch_rows(
        engine,
        """
        SELECT flow_date, asset, direction, transfer_count, total_volume_native, total_volume_usd
        FROM cex_flows
        """,
    )
    assert_rows_match("cex_flows", cex_expected, cex_actual)

    price_expected = [
        (
            row.price_date,
            row.asset,
            quantize_decimal(row.price_usd, "0.00000001"),
            quantize_decimal(row.volume_usd, "0.01"),
            quantize_decimal(row.market_cap_usd, "0.01"),
        )
        for row in price_rows
    ]
    prune_stale_rows(
        engine,
        "prices",
        ("price_date", "asset"),
        [(row.price_date, row.asset) for row in price_rows],
    )
    price_actual = fetch_rows(
        engine,
        "SELECT price_date, asset, price_usd, volume_usd, market_cap_usd FROM prices",
    )
    assert_rows_match("prices", price_expected, price_actual)

    event_window_expected = [
        (
            row.event_id,
            row.day_offset,
            quantize_decimal(row.whale_volume_usd, "0.01"),
            quantize_decimal(row.cex_inflow_usd, "0.01"),
            quantize_decimal(row.cex_outflow_usd, "0.01"),
            quantize_decimal(row.eth_price_usd, "0.00000001"),
            quantize_decimal(row.btc_price_usd, "0.00000001"),
        )
        for row in event_windows
    ]
    prune_stale_rows(
        engine,
        "event_windows",
        ("event_id", "day_offset"),
        [(row.event_id, row.day_offset) for row in event_windows],
    )
    event_window_actual = fetch_rows(
        engine,
        """
        SELECT
            event_id,
            day_offset,
            whale_volume_usd,
            cex_inflow_usd,
            cex_outflow_usd,
            eth_price_usd,
            btc_price_usd
        FROM event_windows
        """,
    )
    assert_rows_match("event_windows", event_window_expected, event_window_actual)


def main() -> None:
    engine = get_engine()

    whale_rows = normalize_whale_rows(load_whale_transfer_rows())
    cex_rows = normalize_cex_rows(load_cex_flow_rows())
    price_rows = load_price_rows()

    validate_whale_rows(whale_rows)
    validate_cex_rows(cex_rows)
    validate_price_rows(price_rows)

    load_whale_transfers(engine, whale_rows)
    load_cex_flows(engine, cex_rows)
    load_prices(engine, price_rows)

    events = load_events_for_windows(engine)
    event_windows = build_event_windows(events, whale_rows, cex_rows, price_rows)
    validate_event_windows(event_windows)
    load_event_windows(engine, event_windows)
    verify_persisted_state(engine, whale_rows, cex_rows, price_rows, event_windows)

    write_counts_snapshot(engine)
    print(
        f"Loaded whale_transfers={len(whale_rows)} "
        f"cex_flows={len(cex_rows)} "
        f"prices={len(price_rows)} "
        f"event_windows={len(event_windows)}"
    )


if __name__ == "__main__":
    main()
