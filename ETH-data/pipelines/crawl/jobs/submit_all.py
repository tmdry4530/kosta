from __future__ import annotations

import json
from datetime import UTC, datetime

from sqlalchemy import text

from crawl.core import submit_crawl_job
from crawl.load import upsert_crawl_job
from crawl.models import JobSnapshot
from crawl.source_loader import load_source_configs
from pipelines.db import get_engine


def already_submitted_today(source: str) -> bool:
    query = text(
        "SELECT count(*) FROM crawl_jobs "
        "WHERE source = :source AND submitted_at::date = CURRENT_DATE"
    )
    with get_engine().connect() as connection:
        count = int(connection.execute(query, {"source": source}).scalar_one())
    return count > 0


def main() -> None:
    for config in load_source_configs():
        if config.id == "fear_greed":
            continue
        for job in config.jobs:
            source_key = f"{config.id}:{job.job_name}"
            if already_submitted_today(source_key):
                continue
            payload = {
                "url": job.url,
                "source": job.source,
                "depth": job.depth,
                "limit": job.limit,
                "formats": job.formats,
                "render": job.render,
            }
            if job.options:
                payload["options"] = job.options
            job_id = submit_crawl_job(payload)
            snapshot = JobSnapshot(
                job_id=job_id,
                source=source_key,
                status="submitted",
                request_payload=payload,
                submitted_at=datetime.now(UTC),
                completed_at=None,
            )
            upsert_crawl_job(snapshot)
            print(json.dumps({"source": source_key, "job_id": job_id}))


if __name__ == "__main__":
    main()
