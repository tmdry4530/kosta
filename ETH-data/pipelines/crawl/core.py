from __future__ import annotations

import json
import os
import time
import urllib.parse
import urllib.request
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, cast
from urllib.error import HTTPError, URLError

from crawl.models import CrawlRecord, JobSnapshot

API_BASE = os.environ.get("CLOUDFLARE_CRAWL_BASE_URL", "https://api.cloudflare.com/client/v4")
CACHE_DIR = Path(__file__).resolve().parents[1] / "data" / "crawled"


def _require_credentials() -> tuple[str, str]:
    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    api_token = os.environ.get("CLOUDFLARE_API_TOKEN")
    if not account_id or not api_token:
        raise RuntimeError(
            "Cloudflare crawl credentials are required for this operation "
            "(CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN)."
        )
    return account_id, api_token


def build_crawl_url(path: str) -> str:
    account_id, _ = _require_credentials()
    return f"{API_BASE}/accounts/{account_id}/browser-rendering/crawl{path}"


def _request(
    url: str,
    method: str = "GET",
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    _, api_token = _require_credentials()
    data = json.dumps(payload).encode() if payload is not None else None
    for attempt in range(3):
        request = urllib.request.Request(
            url,
            data=data,
            method=method,
            headers={
                "Authorization": f"Bearer {api_token}",
                "Content-Type": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                return cast(dict[str, Any], json.loads(response.read().decode()))
        except (TimeoutError, URLError) as exc:
            if attempt == 2:
                raise RuntimeError(f"Cloudflare request failed for {url}") from exc
            time.sleep(2 * (attempt + 1))
        except HTTPError:
            raise
    raise RuntimeError(f"Cloudflare request failed for {url}")


def submit_crawl_job(payload: dict[str, Any]) -> str:
    response = _request(build_crawl_url(""), method="POST", payload=payload)
    return str(response["result"])


def get_job_page(
    job_id: str,
    *,
    status: str | None = None,
    cursor: int | None = None,
    limit: int | None = None,
) -> dict[str, Any]:
    params: dict[str, str] = {}
    if status is not None:
        params["status"] = status
    if cursor is not None:
        params["cursor"] = str(cursor)
    if limit is not None:
        params["limit"] = str(limit)
    suffix = f"/{job_id}"
    if params:
        suffix += f"?{urllib.parse.urlencode(params)}"
    return _request(build_crawl_url(suffix))


def normalize_job_status(result: dict[str, Any]) -> str:
    status = str(result.get("status", "running"))
    finished = int(result.get("finished", 0))
    total = int(result.get("total", 0))
    if status == "completed" or (total > 0 and finished >= total):
        return "done"
    if status in {"errored"}:
        return "errored"
    if status.startswith("cancelled"):
        return "cancelled"
    return "running"


def fetch_records(job_id: str, status: str) -> list[CrawlRecord]:
    cursor = 0
    records: list[CrawlRecord] = []
    seen_pages = 0
    while True:
        payload = get_job_page(job_id, status=status, cursor=cursor, limit=100)
        result = payload.get("result", {})
        page_records = result.get("records", [])
        if not page_records:
            break
        for record in page_records:
            records.append(
                CrawlRecord(
                    url=record.get("url", ""),
                    status=record.get("status", status),
                    markdown=record.get("markdown"),
                    html=record.get("html"),
                    metadata=record.get("metadata", {}),
                )
            )
        next_cursor = result.get("cursor")
        seen_pages += 1
        if next_cursor in {None, cursor} or seen_pages > 200:
            break
        cursor = int(next_cursor)
    return records


def snapshot_job(job_id: str, source: str, request_payload: dict[str, Any]) -> JobSnapshot:
    payload = get_job_page(job_id)
    result = payload.get("result", {})
    records = (
        fetch_records(job_id, "completed")
        + fetch_records(job_id, "skipped")
        + fetch_records(job_id, "errored")
    )
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = CACHE_DIR / f"{source}_{job_id}.json"
    cache_payload = {
        "job": payload,
        "records": [record.__dict__ for record in records],
    }
    cache_path.write_text(
        json.dumps(cache_payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    completed_at = datetime.now(UTC) if normalize_job_status(result) != "running" else None
    return JobSnapshot(
        job_id=job_id,
        source=source,
        status=normalize_job_status(result),
        request_payload=request_payload,
        submitted_at=datetime.now(UTC),
        completed_at=completed_at,
        records=records,
        raw_payload=payload,
        cache_path=cache_path,
    )
