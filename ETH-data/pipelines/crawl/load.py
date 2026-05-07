from __future__ import annotations

import json
import os
import urllib.request
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from sqlalchemy import text

from crawl.models import CrawlRecord, EventRecord, FearGreedRow, JobSnapshot, ParsedArticle
from crawl.utils import match_event, parse_url_date, slug_to_title
from pipelines.db import get_engine


def upsert_crawl_job(snapshot: JobSnapshot) -> None:
    engine = get_engine()
    payload = {
        "job_id": snapshot.job_id,
        "event_id": None,
        "source": snapshot.source,
        "request_payload": json.dumps(snapshot.request_payload),
        "status": snapshot.status,
        "pages_crawled": len(snapshot.records),
        "error_message": None,
        "completed_at": snapshot.completed_at,
    }
    sql = text(
        """
        INSERT INTO crawl_jobs (
            job_id, event_id, source, request_payload,
            status, pages_crawled, error_message, completed_at
        )
        VALUES (
            :job_id, :event_id, :source, CAST(:request_payload AS jsonb),
            :status, :pages_crawled, :error_message, :completed_at
        )
        ON CONFLICT (job_id) DO UPDATE SET
            status = EXCLUDED.status,
            pages_crawled = EXCLUDED.pages_crawled,
            error_message = EXCLUDED.error_message,
            completed_at = EXCLUDED.completed_at,
            request_payload = EXCLUDED.request_payload;
        """
    )
    with engine.begin() as connection:
        connection.execute(sql, payload)


def upsert_articles(articles: list[ParsedArticle]) -> None:
    if not articles:
        return
    engine = get_engine()
    sql = text(
        """
        INSERT INTO news_articles (
            event_id, source, url, title,
            summary, published_at, language, crawl_job_id
        )
        VALUES (:event_id, :source, :url, :title, :summary, :published_at, :language, :crawl_job_id)
        ON CONFLICT (url) DO UPDATE SET
            event_id = EXCLUDED.event_id,
            source = EXCLUDED.source,
            title = EXCLUDED.title,
            summary = EXCLUDED.summary,
            published_at = EXCLUDED.published_at,
            language = EXCLUDED.language,
            crawl_job_id = EXCLUDED.crawl_job_id;
        """
    )
    with engine.begin() as connection:
        connection.execute(sql, [article.__dict__ for article in articles])


def fetch_fear_greed_rows(api_url: str) -> list[FearGreedRow]:
    with urllib.request.urlopen(api_url, timeout=60) as response:
        payload = json.loads(response.read().decode())
    rows: list[FearGreedRow] = []
    for row in payload.get("data", []):
        timestamp = int(row["timestamp"])
        rows.append(
            FearGreedRow(
                index_date=datetime.fromtimestamp(timestamp, tz=UTC).date(),
                value=int(row["value"]),
                classification=row["value_classification"],
            )
        )
    return rows


def upsert_fear_greed(rows: list[FearGreedRow]) -> None:
    if not rows:
        return
    engine = get_engine()
    sql = text(
        """
        INSERT INTO fear_greed_index (index_date, value, classification)
        VALUES (:index_date, :value, :classification)
        ON CONFLICT (index_date) DO UPDATE SET
            value = EXCLUDED.value,
            classification = EXCLUDED.classification,
            crawled_at = now();
        """
    )
    with engine.begin() as connection:
        connection.execute(sql, [row.__dict__ for row in rows])


def backfill_event_windows() -> None:
    engine = get_engine()
    sql = text(
        """
        UPDATE event_windows AS ew
        SET fear_greed_value = fgi.value
        FROM events AS e, fear_greed_index AS fgi
        WHERE ew.event_id = e.id
          AND fgi.index_date = e.event_date + ew.day_offset;
        """
    )
    with engine.begin() as connection:
        connection.execute(sql)


def fetch_jobs_to_collect() -> list[tuple[str, str, dict[str, Any]]]:
    engine = get_engine()
    query = text(
        "SELECT job_id, source, request_payload FROM crawl_jobs "
        "WHERE status IN ('submitted', 'running') ORDER BY submitted_at"
    )
    with engine.connect() as connection:
        rows = connection.execute(query).all()
    return [(row.job_id, row.source, dict(row.request_payload)) for row in rows]


def fetch_jobs_for_processing() -> list[tuple[str, str, dict[str, Any], str]]:
    engine = get_engine()
    query = text(
        "SELECT job_id, source, request_payload, status FROM crawl_jobs "
        "WHERE submitted_at::date = CURRENT_DATE "
        "ORDER BY submitted_at"
    )
    with engine.connect() as connection:
        rows = connection.execute(query).all()
    return [
        (row.job_id, row.source, dict(row.request_payload), row.status)
        for row in rows
    ]


def load_cached_snapshot(source: str, job_id: str) -> JobSnapshot | None:
    path = Path(__file__).resolve().parents[1] / "data" / "crawled" / f"{source}_{job_id}.json"
    if not path.exists():
        return None
    payload = json.loads(path.read_text(encoding="utf-8"))
    records = [CrawlRecord(**record) for record in payload.get("records", [])]
    return JobSnapshot(
        job_id=job_id,
        source=source,
        status=payload.get("job", {}).get("result", {}).get("status", "done"),
        request_payload={},
        submitted_at=datetime.now(UTC),
        completed_at=datetime.now(UTC),
        records=records,
        raw_payload=payload.get("job"),
        cache_path=path,
    )


def count_news_coverage() -> tuple[int, int, int]:
    engine = get_engine()
    query = text(
        """
        SELECT
            (SELECT count(*) FROM news_articles),
            (SELECT count(DISTINCT event_id) FROM news_articles),
            (SELECT count(*) FROM event_windows WHERE fear_greed_value IS NOT NULL)
        """
    )
    with engine.connect() as connection:
        row = connection.execute(query).one()
    return int(row[0]), int(row[1]), int(row[2])


def missing_event_ids() -> list[str]:
    engine = get_engine()
    query = text(
        """
        SELECT e.id
        FROM events AS e
        LEFT JOIN news_articles AS n ON n.event_id = e.id
        WHERE n.event_id IS NULL
        ORDER BY e.event_date, e.id
        """
    )
    with engine.connect() as connection:
        rows = connection.execute(query).all()
    return [str(row.id) for row in rows]


def reconcile_article_event_matches(events: list[EventRecord]) -> tuple[int, int]:
    engine = get_engine()
    select_sql = text(
        """
        SELECT id, event_id, source, url, title, summary, published_at, language, crawl_job_id
        FROM news_articles
        ORDER BY id
        """
    )
    update_sql = text("UPDATE news_articles SET event_id = :event_id WHERE id = :id")
    delete_sql = text("DELETE FROM news_articles WHERE id = :id")

    reassigned = 0
    removed = 0

    with engine.begin() as connection:
        rows = connection.execute(select_sql).all()
        for row in rows:
            candidate_published_at = row.published_at or parse_url_date(row.url)
            candidate = ParsedArticle(
                event_id=row.event_id,
                source=row.source,
                url=row.url,
                title=row.title,
                summary=row.summary,
                published_at=candidate_published_at,
                language=row.language,
                crawl_job_id=row.crawl_job_id,
            )
            matched_event_id = match_event(candidate, events)
            if matched_event_id is None:
                connection.execute(delete_sql, {"id": row.id})
                removed += 1
                continue
            if matched_event_id != row.event_id:
                connection.execute(update_sql, {"id": row.id, "event_id": matched_event_id})
                reassigned += 1

    return reassigned, removed


def has_cloudflare_credentials() -> bool:
    return bool(
        os.environ.get("CLOUDFLARE_ACCOUNT_ID")
        and os.environ.get("CLOUDFLARE_API_TOKEN")
    )


def backfill_reference_articles(events: list[EventRecord], event_ids: list[str]) -> int:
    event_map = {event.id: event for event in events}
    articles: list[ParsedArticle] = []
    for event_id in event_ids:
        event = event_map.get(event_id)
        if event is None or not event.source_url:
            continue
        articles.append(
            ParsedArticle(
                event_id=event.id,
                source="reference",
                url=event.source_url,
                title=event.name_en or slug_to_title(event.source_url),
                summary=event.description,
                published_at=parse_url_date(event.source_url),
                language="en",
                crawl_job_id=None,
            )
        )
    upsert_articles(articles)
    return len(articles)


def canonicalize_reference_articles(events: list[EventRecord]) -> int:
    engine = get_engine()
    event_map = {event.id: event for event in events if event.source_url}
    if not event_map:
        return 0

    select_sql = text(
        """
        SELECT DISTINCT event_id
        FROM news_articles
        WHERE source = 'reference'
        """
    )
    delete_sql = text(
        """
        DELETE FROM news_articles
        WHERE source = 'reference' AND event_id = :event_id
        """
    )

    with engine.begin() as connection:
        rows = connection.execute(select_sql).all()
        event_ids = [str(row.event_id) for row in rows if str(row.event_id) in event_map]
        for event_id in event_ids:
            connection.execute(delete_sql, {"event_id": event_id})

    if not event_ids:
        return 0
    return backfill_reference_articles(events, event_ids)
