from datetime import date

from pipelines.ingest.cex_flow_loader import load_cex_flow_rows
from pipelines.ingest.price_loader import load_price_rows
from pipelines.ingest.whale_csv_loader import load_whale_transfer_rows
from pipelines.transform.cex_direction import normalize_cex_rows
from pipelines.transform.event_windows import EventRecord, build_event_windows
from pipelines.transform.whale_transfers import normalize_whale_rows


def test_event_windows_count_and_offsets() -> None:
    events = [
        EventRecord(id="ftx_collapse", event_date=date(2022, 11, 11)),
        EventRecord(id="eth_etf_approval", event_date=date(2024, 5, 23)),
    ]
    windows = build_event_windows(
        events,
        normalize_whale_rows(load_whale_transfer_rows()),
        normalize_cex_rows(load_cex_flow_rows()),
        load_price_rows(),
    )
    assert len(windows) == 30
    assert {row.day_offset for row in windows} == set(range(-7, 8))
    ftx_rows = [row for row in windows if row.event_id == "ftx_collapse"]
    assert len(ftx_rows) == 15
    assert any(row.cex_inflow_usd is not None for row in ftx_rows)
