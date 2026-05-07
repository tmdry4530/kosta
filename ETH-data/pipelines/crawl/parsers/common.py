from __future__ import annotations

from crawl.models import ArticleCandidate, CrawlRecord
from crawl.utils import (
    extract_markdown_candidates,
    looks_like_article_url,
    markdown_summary,
    parse_url_date,
    slug_to_title,
)


def parse_records(records: list[CrawlRecord], source: str, language: str) -> list[ArticleCandidate]:
    candidates: list[ArticleCandidate] = []
    seen_urls: set[str] = set()
    for record in records:
        if record.url and looks_like_article_url(record.url) and record.url not in seen_urls:
            seen_urls.add(record.url)
            candidates.append(
                ArticleCandidate(
                    url=record.url,
                    title=record.metadata.get("title") or slug_to_title(record.url),
                    summary=markdown_summary(record.markdown),
                    published_at=parse_url_date(record.url),
                    language=language,
                    source=source,
                )
            )
        for candidate in extract_markdown_candidates(record.markdown, source, language):
            if candidate.url in seen_urls:
                continue
            seen_urls.add(candidate.url)
            candidates.append(candidate)
    return candidates
