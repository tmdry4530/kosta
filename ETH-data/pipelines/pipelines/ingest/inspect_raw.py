from __future__ import annotations

import csv
from pathlib import Path

from pipelines.config import get_settings


def inspect() -> None:
    settings = get_settings()
    paths = [
        Path(settings.whale_glob.replace("*.csv", "2017.csv")),
        Path(settings.cex_flow_csv),
        settings.eth_price_csv,
        settings.btc_price_csv,
    ]
    for path in paths:
        print(f"## {path}")
        with path.open(newline="", encoding="utf-8") as handle:
            reader = csv.reader(handle)
            for index, row in zip(range(3), reader, strict=False):
                print(index, row)


if __name__ == "__main__":
    inspect()
