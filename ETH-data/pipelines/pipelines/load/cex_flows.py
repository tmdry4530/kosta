from __future__ import annotations

from sqlalchemy.engine import Engine

from pipelines.ingest.cex_flow_loader import CexFlowRow
from pipelines.load.common import upsert_rows

UPSERT_SQL = """
INSERT INTO cex_flows (
    flow_date,
    asset,
    direction,
    transfer_count,
    total_volume_native,
    total_volume_usd
) VALUES (
    :flow_date,
    :asset,
    :direction,
    :transfer_count,
    :total_volume_native,
    :total_volume_usd
)
ON CONFLICT (flow_date, asset, direction) DO UPDATE SET
    transfer_count = EXCLUDED.transfer_count,
    total_volume_native = EXCLUDED.total_volume_native,
    total_volume_usd = EXCLUDED.total_volume_usd;
"""


def load_cex_flows(engine: Engine, rows: list[CexFlowRow]) -> None:
    payload = [row.__dict__.copy() for row in rows]
    upsert_rows(engine, UPSERT_SQL, payload)
