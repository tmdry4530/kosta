from pipelines.ingest.cex_flow_loader import load_cex_flow_rows
from pipelines.ingest.price_loader import load_price_rows
from pipelines.ingest.whale_csv_loader import load_whale_transfer_rows
from pipelines.transform.whale_transfers import normalize_whale_rows


def test_load_whale_rows() -> None:
    rows = load_whale_transfer_rows()
    assert rows
    assert {row.asset for row in rows} == {"ETH", "USDT", "USDC"}


def test_load_cex_rows() -> None:
    rows = load_cex_flow_rows()
    assert rows
    assert {row.direction for row in rows} == {"inflow", "outflow"}


def test_load_price_rows() -> None:
    rows = load_price_rows()
    assert rows
    assert {row.asset for row in rows} == {"ETH", "BTC"}


def test_normalize_whale_rows_reconciles_boundary_duplicates() -> None:
    raw_rows = load_whale_transfer_rows()
    normalized_rows = normalize_whale_rows(raw_rows)
    keys = {(row.week_start, row.asset) for row in normalized_rows}
    assert len(keys) == len(normalized_rows)
    overlap = [
        row
        for row in normalized_rows
        if row.week_start.isoformat() == "2018-12-31" and row.asset == "ETH"
    ]
    assert len(overlap) == 1
    assert overlap[0].transfer_count == 405
