from sqlalchemy import create_engine, text

from pipelines.load.reconcile import fetch_rows, prune_stale_rows


def test_prune_stale_rows_removes_db_only_keys() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE whale_transfers (week_start TEXT, asset TEXT)"))
        connection.execute(
            text(
                "INSERT INTO whale_transfers (week_start, asset) VALUES "
                "('2024-01-01', 'ETH'), ('2024-01-08', 'ETH')"
            )
        )

    prune_stale_rows(
        engine,
        "whale_transfers",
        ("week_start", "asset"),
        [("2024-01-01", "ETH")],
    )

    rows = fetch_rows(engine, "SELECT week_start, asset FROM whale_transfers")
    assert rows == [("2024-01-01", "ETH")]
