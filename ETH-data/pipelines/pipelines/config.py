from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = ROOT_DIR.parent


@dataclass(frozen=True)
class Settings:
    database_url: str = os.environ.get(
        "DATABASE_URL",
        "postgresql+psycopg://whales:whales@localhost:5432/whales",
    )
    whale_glob: str = str(REPO_DIR / "whale_data" / "whales_*.csv")
    legacy_exchange_glob: str = str(REPO_DIR / "exchange_flow_data" / "exchange_flow_*.csv")
    cex_flow_csv: Path = ROOT_DIR / "data" / "raw" / "dune_query_7329547_results.csv"
    eth_price_csv: Path = REPO_DIR / "price_data" / "eth_price.csv"
    btc_price_csv: Path = REPO_DIR / "price_data" / "btc_price.csv"
    processed_dir: Path = ROOT_DIR / "data" / "processed"


def get_settings() -> Settings:
    return Settings()
