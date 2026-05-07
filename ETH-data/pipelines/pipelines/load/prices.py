from __future__ import annotations

from sqlalchemy.engine import Engine

from pipelines.ingest.price_loader import PriceRow
from pipelines.load.common import upsert_rows

UPSERT_SQL = """
INSERT INTO prices (
    price_date,
    asset,
    price_usd,
    volume_usd,
    market_cap_usd
) VALUES (
    :price_date,
    :asset,
    :price_usd,
    :volume_usd,
    :market_cap_usd
)
ON CONFLICT (price_date, asset) DO UPDATE SET
    price_usd = EXCLUDED.price_usd,
    volume_usd = EXCLUDED.volume_usd,
    market_cap_usd = EXCLUDED.market_cap_usd;
"""


def load_prices(engine: Engine, rows: list[PriceRow]) -> None:
    payload = [row.__dict__.copy() for row in rows]
    upsert_rows(engine, UPSERT_SQL, payload)
