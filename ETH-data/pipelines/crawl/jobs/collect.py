from __future__ import annotations

import time
from datetime import UTC, datetime
from importlib import import_module
from typing import Protocol, cast

from sqlalchemy import text

from crawl.core import get_job_page, normalize_job_status, snapshot_job, submit_crawl_job
from crawl.load import (
    backfill_event_windows,
    backfill_reference_articles,
    canonicalize_reference_articles,
    count_news_coverage,
    fetch_fear_greed_rows,
    fetch_jobs_for_processing,
    fetch_jobs_to_collect,
    has_cloudflare_credentials,
    load_cached_snapshot,
    missing_event_ids,
    reconcile_article_event_matches,
    upsert_articles,
    upsert_crawl_job,
    upsert_fear_greed,
)
from crawl.models import ArticleCandidate, CrawlRecord, EventRecord, JobSnapshot, ParsedArticle
from crawl.source_loader import load_source_configs
from crawl.utils import load_events, markdown_summary, match_event, parse_url_date, slug_to_title
from pipelines.db import get_engine


class ParserModule(Protocol):
    def parse(self, records: list[CrawlRecord]) -> list[ArticleCandidate]: ...


def parse_candidates(source_id: str, records: list[CrawlRecord]) -> list[ArticleCandidate]:
    config_map = {config.id: config for config in load_source_configs()}
    base_source = source_id.split(":", 1)[0]
    config = config_map.get(base_source)
    parser_name = config.parser if config is not None else None
    if parser_name is None:
        return []
    parser = cast(ParserModule, import_module(f"crawl.parsers.{parser_name}"))
    return parser.parse(records)


def to_parsed_articles(
    candidates: list[ArticleCandidate],
    events: list[EventRecord],
    crawl_job_id: str | None,
) -> list[ParsedArticle]:
    parsed: list[ParsedArticle] = []
    seen_urls: set[str] = set()
    for candidate in candidates:
        if candidate.url in seen_urls:
            continue
        seen_urls.add(candidate.url)
        event_id = match_event(candidate, events)
        if event_id is None:
            continue
        parsed.append(
            ParsedArticle(
                event_id=event_id,
                source=candidate.source,
                url=candidate.url,
                title=candidate.title,
                summary=candidate.summary,
                published_at=candidate.published_at,
                language=candidate.language,
                crawl_job_id=crawl_job_id,
            )
        )
    return parsed


def submit_reference_fallback(events: list[EventRecord], missing_ids: list[str]) -> None:
    event_map = {event.id: event for event in events}
    for event_id in missing_ids:
        event = event_map[event_id]
        if not event.source_url:
            continue
        payload = {
            "url": event.source_url,
            "limit": 1,
            "depth": 1,
            "formats": ["markdown"],
            "render": False,
        }
        job_id = submit_crawl_job(payload)
        snapshot = JobSnapshot(
            job_id=job_id,
            source=f"reference:{event.id}",
            status="submitted",
            request_payload=payload,
            submitted_at=datetime.now(UTC),
            completed_at=None,
        )
        upsert_crawl_job(snapshot)


def collect_reference_results(events: list[EventRecord]) -> None:
    query = text(
        "SELECT job_id, source, request_payload FROM crawl_jobs "
        "WHERE status IN ('submitted','running') AND source LIKE 'reference:%'"
    )
    with get_engine().connect() as connection:
        jobs = connection.execute(query).all()
    for job in jobs:
        snapshot: JobSnapshot | None = None
        for _ in range(20):
            payload = get_job_page(job.job_id)
            result = payload.get("result", {})
            status = normalize_job_status(result)
            if status != "running":
                snapshot = snapshot_job(job.job_id, job.source, dict(job.request_payload))
                break
            time.sleep(3)
        if snapshot is None:
            continue
        upsert_crawl_job(snapshot)
        event_id = job.source.split(":", 1)[1]
        articles: list[ParsedArticle] = []
        for record in snapshot.records:
            if record.status != "completed":
                continue
            title = record.metadata.get("title") or slug_to_title(record.url)
            articles.append(
                ParsedArticle(
                    event_id=event_id,
                    source="reference",
                    url=record.url,
                    title=title,
                    summary=markdown_summary(record.markdown),
                    published_at=parse_url_date(record.url),
                    language="en",
                    crawl_job_id=job.job_id,
                )
            )
        upsert_articles(articles)


def poll_active_jobs(rounds: int = 5, delay_seconds: int = 5) -> None:
    for _ in range(rounds):
        active = fetch_jobs_to_collect()
        if not active:
            return
        for job_id, source, payload in active:
            snapshot = snapshot_job(job_id, source, payload)
            upsert_crawl_job(snapshot)
        time.sleep(delay_seconds)


def main() -> None:
    events = load_events(get_engine())
    poll_active_jobs()

    for job_id, source, payload, status in fetch_jobs_for_processing():
        if source.startswith("reference:"):
            continue
        snapshot = load_cached_snapshot(source, job_id)
        if snapshot is None or status == "running":
            snapshot = snapshot_job(job_id, source, payload)
            upsert_crawl_job(snapshot)
        if snapshot.status == "running":
            continue
        candidates = parse_candidates(source, snapshot.records)
        articles = to_parsed_articles(candidates, events, snapshot.job_id)
        upsert_articles(articles)

    config_map = {config.id: config for config in load_source_configs()}
    fear_greed_url = config_map["fear_greed"].api_url
    if fear_greed_url is not None:
        upsert_fear_greed(fetch_fear_greed_rows(fear_greed_url))
        backfill_event_windows()

    reassigned, removed = reconcile_article_event_matches(events)
    canonicalized = canonicalize_reference_articles(events)

    backfilled = 0
    missing_ids = missing_event_ids()
    if missing_ids:
        if has_cloudflare_credentials():
            submit_reference_fallback(events, missing_ids)
            collect_reference_results(events)
            missing_ids = missing_event_ids()
        if missing_ids:
            backfilled = backfill_reference_articles(events, missing_ids)
            if not has_cloudflare_credentials():
                print(f"reference_fallback_skipped_missing_credentials={len(missing_ids)}")
        extra_reassigned, extra_removed = reconcile_article_event_matches(events)
        reassigned += extra_reassigned
        removed += extra_removed
        canonicalized += canonicalize_reference_articles(events)
        final_missing_ids = missing_event_ids()
        if final_missing_ids:
            backfilled += backfill_reference_articles(events, final_missing_ids)

    article_count, covered_events, windows_with_fg = count_news_coverage()
    missing_count = len(missing_event_ids())
    print(
        f"articles={article_count} covered_events={covered_events} "
        f"windows_with_fg={windows_with_fg} missing={missing_count} "
        f"backfilled={backfilled} canonicalized={canonicalized} "
        f"reassigned={reassigned} removed={removed}"
    )


if __name__ == "__main__":
    main()
