from __future__ import annotations

import json
from pathlib import Path

from crawl.models import CrawlJobSpec, SourceConfig

ROOT = Path(__file__).resolve().parent
SOURCES_DIR = ROOT / "sources"


def load_source_configs() -> list[SourceConfig]:
    configs: list[SourceConfig] = []
    for path in sorted(SOURCES_DIR.glob("*.yaml")):
        data = json.loads(path.read_text(encoding="utf-8"))
        jobs = [
            CrawlJobSpec(
                source_id=data["id"],
                job_name=job["name"],
                url=job["url"],
                source=job.get("source", "links"),
                depth=job.get("depth", 1),
                limit=job.get("limit", 1),
                formats=job.get("formats", ["markdown"]),
                render=job.get("render", False),
                options=job.get("options", {}),
            )
            for job in data.get("jobs", [])
        ]
        configs.append(
            SourceConfig(
                id=data["id"],
                name=data["name"],
                language=data.get("language", "en"),
                parser=data.get("parser"),
                jobs=jobs,
                api_url=data.get("api_url"),
            )
        )
    return configs
