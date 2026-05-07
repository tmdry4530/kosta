from __future__ import annotations

from sqlalchemy.engine import Engine

from pipelines.ingest.whale_csv_loader import WhaleTransferRow
from pipelines.load.common import upsert_rows

UPSERT_SQL = """
INSERT INTO whale_transfers (
    week_start,
    asset,
    transfer_count,
    total_volume_native,
    total_volume_usd,
    unique_senders,
    unique_receivers
) VALUES (
    :week_start,
    :asset,
    :transfer_count,
    :total_volume_native,
    :total_volume_usd,
    :unique_senders,
    :unique_receivers
)
ON CONFLICT (week_start, asset) DO UPDATE SET
    transfer_count = EXCLUDED.transfer_count,
    total_volume_native = EXCLUDED.total_volume_native,
    total_volume_usd = EXCLUDED.total_volume_usd,
    unique_senders = EXCLUDED.unique_senders,
    unique_receivers = EXCLUDED.unique_receivers;
"""


def load_whale_transfers(engine: Engine, rows: list[WhaleTransferRow]) -> None:
    payload = [row.__dict__.copy() for row in rows]
    upsert_rows(engine, UPSERT_SQL, payload)
