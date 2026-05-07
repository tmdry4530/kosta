from __future__ import annotations

from crawl.models import ArticleCandidate, CrawlRecord
from crawl.parsers.common import parse_records


def parse(records: list[CrawlRecord]) -> list[ArticleCandidate]:
    return parse_records(records, source="cointelegraph", language="en")
