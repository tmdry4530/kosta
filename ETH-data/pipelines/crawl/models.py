from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class CrawlJobSpec:
    source_id: str
    job_name: str
    url: str
    source: str
    depth: int
    limit: int
    formats: list[str]
    render: bool
    options: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class SourceConfig:
    id: str
    name: str
    language: str
    parser: str | None = None
    jobs: list[CrawlJobSpec] = field(default_factory=list)
    api_url: str | None = None


@dataclass(frozen=True)
class EventRecord:
    id: str
    event_date: date
    name_ko: str
    name_en: str
    description: str
    source_url: str | None


@dataclass(frozen=True)
class CrawlRecord:
    url: str
    status: str
    markdown: str | None
    html: str | None
    metadata: dict[str, Any]


@dataclass(frozen=True)
class ArticleCandidate:
    url: str
    title: str
    summary: str | None
    published_at: datetime | None
    language: str
    source: str


@dataclass(frozen=True)
class ParsedArticle:
    event_id: str
    source: str
    url: str
    title: str
    summary: str | None
    published_at: datetime | None
    language: str
    crawl_job_id: str | None


@dataclass(frozen=True)
class FearGreedRow:
    index_date: date
    value: int
    classification: str


@dataclass(frozen=True)
class JobSnapshot:
    job_id: str
    source: str
    status: str
    request_payload: dict[str, Any]
    submitted_at: datetime
    completed_at: datetime | None
    records: list[CrawlRecord] = field(default_factory=list)
    raw_payload: dict[str, Any] | None = None
    cache_path: Path | None = None
