from datetime import UTC, datetime

from crawl.models import ArticleCandidate, EventRecord
from crawl.utils import extract_markdown_candidates, match_event, parse_url_date, slug_to_title


def test_parse_url_date_from_path() -> None:
    parsed = parse_url_date("https://www.coindesk.com/markets/2022/11/11/example-story")
    assert parsed == datetime(2022, 11, 11, tzinfo=UTC)


def test_slug_to_title() -> None:
    assert (
        slug_to_title("https://www.coindesk.com/markets/2022/11/11/ftx-collapse-explained")
        == "Ftx Collapse Explained"
    )


def test_extract_markdown_candidates() -> None:
    markdown = "[FTX Files for Bankruptcy](https://www.coindesk.com/markets/2022/11/11/ftx-files-for-bankruptcy)"
    candidates = extract_markdown_candidates(markdown, source="coindesk", language="en")
    assert len(candidates) == 1
    assert candidates[0].title == "FTX Files for Bankruptcy"


def test_match_event_prefers_exact_source_url_then_date() -> None:
    event = EventRecord(
        id="ftx_collapse",
        event_date=datetime(2022, 11, 11, tzinfo=UTC).date(),
        name_ko="FTX 파산",
        name_en="FTX Collapse",
        description="desc",
        source_url="https://en.wikipedia.org/wiki/Bankruptcy_of_FTX",
    )
    candidate = ArticleCandidate(
        url="https://en.wikipedia.org/wiki/Bankruptcy_of_FTX",
        title="Bankruptcy of FTX",
        summary=None,
        published_at=None,
        language="en",
        source="reference",
    )
    assert match_event(candidate, [event]) == "ftx_collapse"


def test_match_event_uses_updated_event_date_window() -> None:
    event = EventRecord(
        id="trump_tariff_shock",
        event_date=datetime(2025, 10, 10, tzinfo=UTC).date(),
        name_ko="트럼프 대중 100% 관세 충격",
        name_en="Trump 100% China Tariff Shock",
        description="desc",
        source_url="https://apnews.com/article/trump-xi-china-cc47e258cfc6336dfddcc20fa67a3642",
    )
    candidate = ArticleCandidate(
        url="https://www.coindesk.com/research/2025/03/28/stablecoins-and-cbdcs-report-march-2025",
        title="Stablecoins report",
        summary=None,
        published_at=datetime(2025, 3, 28, tzinfo=UTC),
        language="en",
        source="coindesk",
    )
    assert match_event(candidate, [event]) is None


def test_match_event_requires_keyword_overlap_for_date_based_match() -> None:
    event = EventRecord(
        id="kr_special_act",
        event_date=datetime(2021, 3, 25, tzinfo=UTC).date(),
        name_ko="특금법 시행",
        name_en="Korean Special Reporting Act",
        description="가상자산사업자 신고제 도입",
        source_url=None,
    )
    unrelated_candidate = ArticleCandidate(
        url="https://www.coindesk.com/research/2021/03/31/cryptocompare-digital-asset-management-review-march-2021",
        title="CryptoCompare Digital Asset Management Review March 2021",
        summary=None,
        published_at=datetime(2021, 3, 31, tzinfo=UTC),
        language="en",
        source="coindesk",
    )
    related_candidate = ArticleCandidate(
        url="https://example.com/2021/03/25/korean-special-reporting-act-crypto-exchanges",
        title="Korean Special Reporting Act hits crypto exchanges",
        summary=None,
        published_at=datetime(2021, 3, 25, tzinfo=UTC),
        language="en",
        source="reference",
    )
    assert match_event(unrelated_candidate, [event]) is None
    assert match_event(related_candidate, [event]) == "kr_special_act"
