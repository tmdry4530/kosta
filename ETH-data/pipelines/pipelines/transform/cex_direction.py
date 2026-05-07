from __future__ import annotations

from pipelines.ingest.cex_flow_loader import CexFlowRow


def normalize_cex_rows(rows: list[CexFlowRow]) -> list[CexFlowRow]:
    return sorted(rows, key=lambda row: (row.flow_date, row.asset, row.direction))
