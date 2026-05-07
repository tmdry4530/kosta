from __future__ import annotations

import re
import urllib.parse
from collections.abc import Iterable
from datetime import UTC, datetime

from sqlalchemy import text
from sqlalchemy.engine import Engine

from crawl.models import ArticleCandidate, EventRecord

DATE_PATH_RE = re.compile(r"/(20\d{2})/(\d{2})/(\d{2})/")
DATE_INLINE_RE = re.compile(r"(20\d{2})-(\d{2})-(\d{2})")
LINK_RE = re.compile(r"\[([^\]]+)\]\((https?://[^)]+)\)")
TOKEN_RE = re.compile(r"[A-Za-z0-9가-힣]+")
STOPWORDS = {
    "the", "and", "for", "with", "from", "into", "that", "this", "will", "after",
    "before", "amid", "over", "under", "between", "through", "about", "update",
    "global", "market", "first", "all", "time", "high", "november", "failure",
    "shock", "order", "special", "reporting", "act", "virtual", "asset",
    "spot", "approval", "outbreak", "military", "conflict"
}


def slug_to_title(url: str) -> str:
    path = urllib.parse.urlparse(url).path.rstrip("/")
    slug = path.split("/")[-1]
    slug = re.sub(r"^\d+-", "", slug)
    slug = slug.replace("usd", "USD")
    words = [word for word in slug.replace("-", " ").split() if word]
    if not words:
        return url
    return " ".join(words).strip().title()


def parse_url_date(url: str) -> datetime | None:
    path = urllib.parse.urlparse(url).path
    for pattern in (DATE_PATH_RE, DATE_INLINE_RE):
        match = pattern.search(path)
        if match:
            return datetime(
                int(match.group(1)),
                int(match.group(2)),
                int(match.group(3)),
                tzinfo=UTC,
            )
    return None


def looks_like_article_url(url: str) -> bool:
    path = urllib.parse.urlparse(url).path.lower()
    if any(marker in path for marker in ("/sitemap", "/tag/", "/video", "/podcast", "/price/")):
        return False
    return (
        bool(DATE_PATH_RE.search(path))
        or "/news/" in path
        or "/breaking/" in path
        or "/archives/" in path
        or path.count("/") >= 2
    )


def markdown_summary(markdown: str | None) -> str | None:
    if not markdown:
        return None
    lines = [line.strip() for line in markdown.splitlines() if line.strip()]
    for line in lines:
        if len(line) > 40 and not line.startswith("["):
            return line[:400]
    return None


def extract_markdown_candidates(
    markdown: str | None,
    source: str,
    language: str,
) -> list[ArticleCandidate]:
    if not markdown:
        return []
    candidates: list[ArticleCandidate] = []
    seen_urls: set[str] = set()
    for title, url in LINK_RE.findall(markdown):
        if url in seen_urls or not looks_like_article_url(url):
            continue
        seen_urls.add(url)
        cleaned_title = re.sub(r"\s+", " ", title).strip() or slug_to_title(url)
        candidates.append(
            ArticleCandidate(
                url=url,
                title=cleaned_title,
                summary=None,
                published_at=parse_url_date(url),
                language=language,
                source=source,
            )
        )
    return candidates


def load_events(engine: Engine) -> list[EventRecord]:
    query = text(
        "SELECT id, event_date, name_ko, name_en, description, source_url "
        "FROM events ORDER BY event_date, id"
    )
    with engine.connect() as connection:
        rows = connection.execute(query).all()
    return [
        EventRecord(
            id=row.id,
            event_date=row.event_date,
            name_ko=row.name_ko,
            name_en=row.name_en,
            description=row.description,
            source_url=row.source_url,
        )
        for row in rows
    ]


def tokenize(text: str) -> set[str]:
    return {
        token.lower()
        for token in TOKEN_RE.findall(text)
        if len(token) >= 3 and not token.isdigit() and token.lower() not in STOPWORDS
    }


def event_keywords(event: EventRecord) -> set[str]:
    seed = " ".join(
        filter(
            None,
            [
                event.id.replace("_", " "),
                event.name_ko,
                event.name_en,
                event.description,
            ],
        )
    )
    return tokenize(seed)


def candidate_keywords(candidate: ArticleCandidate) -> set[str]:
    seed = " ".join(filter(None, [candidate.title, candidate.summary or "", candidate.url]))
    return tokenize(seed)


def match_event(candidate: ArticleCandidate, events: Iterable[EventRecord]) -> str | None:
    for event in events:
        if event.source_url and candidate.url.rstrip("/") == event.source_url.rstrip("/"):
            return event.id
    candidate_date = (
        candidate.published_at.date()
        if candidate.published_at is not None
        else parse_url_date(candidate.url)
    )
    if candidate_date is None:
        return None
    if hasattr(candidate_date, "date"):
        candidate_date = candidate_date.date()
    candidate_terms = candidate_keywords(candidate)
    closest: tuple[int, int, str] | None = None
    for event in events:
        delta = abs((candidate_date - event.event_date).days)
        if delta > 7:
            continue
        keywords = event_keywords(event)
        overlap = len(candidate_terms & keywords)
        if overlap == 0:
            continue
        candidate_score = (-overlap, delta, event.id)
        if closest is None or candidate_score < closest:
            closest = candidate_score
    return closest[2] if closest is not None else None
