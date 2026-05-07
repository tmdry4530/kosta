from __future__ import annotations

from sqlalchemy.engine import Engine

from pipelines.load.common import upsert_rows
from pipelines.transform.event_windows import EventWindowRow

UPSERT_SQL = """
INSERT INTO event_windows (
    event_id,
    day_offset,
    whale_volume_usd,
    cex_inflow_usd,
    cex_outflow_usd,
    eth_price_usd,
    btc_price_usd,
    fear_greed_value
) VALUES (
    :event_id,
    :day_offset,
    :whale_volume_usd,
    :cex_inflow_usd,
    :cex_outflow_usd,
    :eth_price_usd,
    :btc_price_usd,
    :fear_greed_value
)
ON CONFLICT (event_id, day_offset) DO UPDATE SET
    whale_volume_usd = EXCLUDED.whale_volume_usd,
    cex_inflow_usd = EXCLUDED.cex_inflow_usd,
    cex_outflow_usd = EXCLUDED.cex_outflow_usd,
    eth_price_usd = EXCLUDED.eth_price_usd,
    btc_price_usd = EXCLUDED.btc_price_usd,
    fear_greed_value = COALESCE(EXCLUDED.fear_greed_value, event_windows.fear_greed_value);
"""


def load_event_windows(engine: Engine, rows: list[EventWindowRow]) -> None:
    payload = [
        {
            'event_id': row.event_id,
            'day_offset': row.day_offset,
            'whale_volume_usd': row.whale_volume_usd,
            'cex_inflow_usd': row.cex_inflow_usd,
            'cex_outflow_usd': row.cex_outflow_usd,
            'eth_price_usd': row.eth_price_usd,
            'btc_price_usd': row.btc_price_usd,
            'fear_greed_value': row.fear_greed_value,
        }
        for row in rows
    ]
    upsert_rows(engine, UPSERT_SQL, payload)
