# DATA_SCHEMA — When Whales Move

> 데이터의 단일 진실 공급원(Single Source of Truth).
> Codex는 새 컬럼/테이블을 만들기 전에 이 문서를 먼저 확인하고, 변경이 필요하면 사용자에게 묻는다.

---

## 1. PostgreSQL 테이블

### 1.1 `events` — 이벤트 카탈로그

`EVENTS.md`의 21개 항목이 적재된다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | TEXT | PK | 슬러그 (예: `ftx_collapse`, `kr_kimchi_premium_2017`) |
| `name_ko` | TEXT | NOT NULL | 한국어 이벤트명 |
| `name_en` | TEXT | NOT NULL | 영문 이벤트명 |
| `event_date` | DATE | NOT NULL | 대표 날짜 (사건의 핵심일) |
| `category` | TEXT | NOT NULL | `crash` / `rally` / `crisis` / `mania` / `regulation` 중 하나 |
| `region` | TEXT | NOT NULL | `global` 또는 `kr` |
| `description` | TEXT | NOT NULL | 1~2문장 한글 설명 (UI 카피로 사용) |
| `source_url` | TEXT |  | 참고 출처 (위키피디아 등) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |  |

**인덱스**: `event_date`, `category`, `region`

### 1.2 `whale_transfers` — 주간 고래 전송 집계

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `week_start` | DATE | PK part | 해당 주의 월요일 (UTC) |
| `asset` | TEXT | PK part | `ETH`, `USDT`, `USDC` |
| `transfer_count` | BIGINT | NOT NULL | 해당 주 고래 기준 충족 트랜잭션 수 |
| `total_volume_native` | NUMERIC(38,8) | NOT NULL | 자산 단위 합계 (ETH 또는 토큰) |
| `total_volume_usd` | NUMERIC(20,2) | NOT NULL | USD 환산 합계 |
| `unique_senders` | INTEGER |  | 고유 발신자 수 |
| `unique_receivers` | INTEGER |  | 고유 수신자 수 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |  |

**PK**: `(week_start, asset)`
**인덱스**: `week_start`

### 1.3 `cex_flows` — 거래소 입출금 일별 집계

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `flow_date` | DATE | PK part | 일자 (UTC) |
| `asset` | TEXT | PK part | `ETH`, `USDT`, `USDC` |
| `direction` | TEXT | PK part | `inflow` (→ 거래소) 또는 `outflow` (← 거래소) |
| `transfer_count` | BIGINT | NOT NULL |  |
| `total_volume_native` | NUMERIC(38,8) | NOT NULL |  |
| `total_volume_usd` | NUMERIC(20,2) | NOT NULL |  |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |  |

**PK**: `(flow_date, asset, direction)`
**인덱스**: `flow_date`

### 1.4 `prices` — 일별 가격

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `price_date` | DATE | PK part |  |
| `asset` | TEXT | PK part | `ETH`, `BTC` (스테이블코인은 ≈$1로 가정, 저장 안 함) |
| `price_usd` | NUMERIC(20,8) | NOT NULL | 종가 |
| `volume_usd` | NUMERIC(24,2) |  | 거래량 (있으면) |
| `market_cap_usd` | NUMERIC(24,2) |  | 시총 (있으면) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |  |

**PK**: `(price_date, asset)`

### 1.5 `event_windows` — 미리 집계된 이벤트별 윈도우 데이터

API 응답을 빠르게 하기 위한 비정규화 테이블. 파이프라인이 갱신.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `event_id` | TEXT | FK → events.id, PK part |  |
| `day_offset` | INTEGER | PK part | 이벤트일 기준 -7 ~ +7 |
| `whale_volume_usd` | NUMERIC(20,2) |  | 해당 일 고래 전송량(USD) |
| `cex_inflow_usd` | NUMERIC(20,2) |  | 거래소 입금 |
| `cex_outflow_usd` | NUMERIC(20,2) |  | 거래소 출금 |
| `eth_price_usd` | NUMERIC(20,8) |  | 해당 일 ETH 가격 |
| `btc_price_usd` | NUMERIC(20,8) |  | 해당 일 BTC 가격 |
| `fear_greed_value` | INTEGER |  | 공포·탐욕 지수 (0~100, 있으면) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |  |

**PK**: `(event_id, day_offset)`

> 참고: 주간 데이터(`whale_transfers`)를 일별 윈도우에 매핑할 때는, 해당 주의 평균을 그 주에 속한 모든 일에 균등 배분하는 방식을 기본으로 한다. 정확도가 부족하면 추후 일별 Dune 쿼리 추가 검토.

### 1.6 `news_articles` — 크롤로 수집한 뉴스 헤드라인

Cloudflare `/crawl`로 수집해 파싱한 결과.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | BIGSERIAL | PK |  |
| `event_id` | TEXT | FK → events.id, NOT NULL | 어느 이벤트의 ±7일 창에서 수집됐는지 |
| `source` | TEXT | NOT NULL | `coindesk`, `cointelegraph`, `tokenpost`, `blockmedia` 등 |
| `url` | TEXT | NOT NULL, UNIQUE | 기사 원문 URL |
| `title` | TEXT | NOT NULL |  |
| `summary` | TEXT |  | 첫 1~2문단 또는 메타 설명 |
| `published_at` | TIMESTAMPTZ |  | 기사 발행 시각 (파싱 가능한 경우) |
| `language` | TEXT |  | `ko` 또는 `en` |
| `crawled_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | 크롤 시점 |
| `crawl_job_id` | TEXT | FK → crawl_jobs.job_id | 어느 크롤 job에서 왔는지 |

**인덱스**: `(event_id, published_at DESC)`, `source`, `language`

### 1.7 `fear_greed_index` — 공포·탐욕 지수 일별

`alternative.me` 크롤 결과.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `index_date` | DATE | PK |  |
| `value` | INTEGER | NOT NULL | 0(극공포) ~ 100(극탐욕) |
| `classification` | TEXT | NOT NULL | `Extreme Fear` / `Fear` / `Neutral` / `Greed` / `Extreme Greed` |
| `crawled_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() |  |

### 1.8 `crawl_jobs` — Cloudflare /crawl 작업 추적

job 상태 추적, 재시도 방지, 비용 모니터링용.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `job_id` | TEXT | PK | Cloudflare가 발급한 job id |
| `event_id` | TEXT | FK → events.id |  |
| `source` | TEXT | NOT NULL | 어느 소스 시드를 크롤했는지 |
| `request_payload` | JSONB | NOT NULL | 제출한 옵션 전체 (재현용) |
| `status` | TEXT | NOT NULL | `submitted` / `running` / `done` / `errored` / `cancelled` |
| `pages_crawled` | INTEGER |  | 완료 시 페이지 수 |
| `error_message` | TEXT |  | 실패 시 사유 |
| `submitted_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() |  |
| `completed_at` | TIMESTAMPTZ |  |  |

**UNIQUE**: `(event_id, source, submitted_at::date)` — 같은 (event, source) 조합은 하루 한 번만 제출.

---

## 2. 원본 CSV 명세 (data/raw/)

이미 다운로드된 파일들. **수정 금지, 원본 보존.**

### 2.1 Dune 주간 고래 전송 (10개 파일)

파일명 패턴: `whale_transfers_{asset}_{year_range}.csv`

예상 컬럼 (실제 파일 확인 후 코드 작성 시 보정):

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `week` | DATE / TEXT | 주 시작일 (UTC, 월요일) |
| `asset` | TEXT | `ETH` / `USDT` / `USDC` |
| `tx_count` | INTEGER | 트랜잭션 수 |
| `volume` | NUMERIC | 자산 단위 |
| `volume_usd` | NUMERIC | USD 환산 |
| `unique_from` | INTEGER (선택) |  |
| `unique_to` | INTEGER (선택) |  |

### 2.2 가격 데이터

파일명: `prices_{asset}_daily.csv` (또는 유사)

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `date` | DATE |  |
| `price` | NUMERIC | 종가 USD |
| `volume` | NUMERIC | 일 거래량 USD |
| `market_cap` | NUMERIC | 시총 USD |

### 2.3 거래소 입출금 데이터

파일명: `cex_flows_{asset}.csv` 또는 통합 파일

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `date` | DATE |  |
| `asset` | TEXT |  |
| `direction` | TEXT | `inflow` / `outflow` |
| `tx_count` | INTEGER |  |
| `volume` | NUMERIC |  |
| `volume_usd` | NUMERIC |  |

> **TODO**: 실제 CSV 헤더는 `pipelines/ingest/`에서 첫 실행 시 검증 스크립트로 확인하고, 다르면 매핑 테이블을 `pipelines/ingest/column_mappings.py`에 정의.

---

## 3. 이벤트 메타데이터 형식 (`EVENTS.md` → DB)

`EVENTS.md`는 사람이 읽기 쉬운 마크다운이다. 파이프라인은 이를 파싱해 `events` 테이블에 적재한다.

각 이벤트는 `EVENTS.md`에서 다음과 같은 YAML 블록 형태로 표현된다:

```yaml
- id: ftx_collapse
  name_ko: FTX 파산
  name_en: FTX Collapse
  event_date: 2022-11-11
  category: crisis
  region: global
  description: 세계 2위 거래소 FTX가 유동성 위기로 파산 신청. 암호화폐 시장 신뢰도에 큰 충격.
  source_url: https://en.wikipedia.org/wiki/Bankruptcy_of_FTX
```

파서는 `pipelines/ingest/events_parser.py`에 둔다. PyYAML 사용.

---

## 4. API 응답 형식 (camelCase JSON)

### 4.1 `GET /api/events`

```json
[
  {
    "id": "ftx_collapse",
    "nameKo": "FTX 파산",
    "nameEn": "FTX Collapse",
    "eventDate": "2022-11-11",
    "category": "crisis",
    "region": "global",
    "description": "세계 2위 거래소 FTX가 ...",
    "sourceUrl": "https://..."
  }
]
```

### 4.2 `GET /api/events/:id/window?days=7`

```json
{
  "event": { "id": "ftx_collapse", "...": "..." },
  "window": [
    {
      "dayOffset": -7,
      "date": "2022-11-04",
      "whaleVolumeUsd": 1234567890,
      "cexInflowUsd": 234567890,
      "cexOutflowUsd": 123456789,
      "ethPriceUsd": 1567.89,
      "btcPriceUsd": 21345.67
    }
  ]
}
```

### 4.3 `GET /api/whale-flows?from=2022-01-01&to=2022-12-31&asset=ETH`

```json
[
  {
    "weekStart": "2022-01-03",
    "asset": "ETH",
    "transferCount": 1234,
    "totalVolumeNative": "987654.12345678",
    "totalVolumeUsd": 3210987654.32
  }
]
```

> NUMERIC 컬럼은 JS 정밀도 손실 방지를 위해 **문자열로 직렬화**한다. 프론트에서 차트 그릴 때만 `Number()`로 변환.

### 4.4 `GET /api/cex-flows?from=&to=&asset=`

```json
[
  {
    "flowDate": "2022-11-08",
    "asset": "ETH",
    "direction": "inflow",
    "transferCount": 45,
    "totalVolumeUsd": 234567890.12
  }
]
```

### 4.5 `GET /api/prices?asset=ETH&from=&to=`

```json
[
  { "priceDate": "2022-11-08", "priceUsd": "1567.89000000" }
]
```

### 4.6 `GET /api/events/:id/news?limit=20`

```json
[
  {
    "id": 1234,
    "source": "coindesk",
    "url": "https://www.coindesk.com/...",
    "title": "FTX Files for Bankruptcy as Crypto's Biggest Domino Falls",
    "summary": "...",
    "publishedAt": "2022-11-11T14:23:00Z",
    "language": "en"
  }
]
```

### 4.7 `GET /api/fear-greed?from=&to=`

```json
[
  {
    "indexDate": "2022-11-11",
    "value": 22,
    "classification": "Extreme Fear"
  }
]
```

---

## 5. 명명 규칙 요약

| 위치 | 규칙 | 예시 |
|---|---|---|
| DB 테이블/컬럼 | snake_case | `whale_transfers.total_volume_usd` |
| Python 변수/함수 | snake_case | `def load_whale_transfers():` |
| TS 변수/함수 | camelCase | `const totalVolumeUsd = ...` |
| TS 타입/컴포넌트 | PascalCase | `type WhaleFlow`, `<EventTimeline />` |
| API JSON | camelCase | `{ "weekStart": "..." }` |
| URL 경로 | kebab-case | `/api/whale-flows` |
| 이벤트 ID | snake_case | `ftx_collapse`, `kr_upbit_hack_2019` |

---

## 6. 데이터 검증 규칙 (Sanity Checks)

파이프라인의 `pipelines/transform/validators.py`에서 강제:

- `whale_transfers.total_volume_usd >= 0`
- `cex_flows.direction IN ('inflow', 'outflow')`
- `events.region IN ('global', 'kr')`
- `events.category IN ('crash', 'rally', 'crisis', 'mania', 'regulation')`
- `event_windows.day_offset BETWEEN -7 AND 7`
- `prices.price_usd > 0`
- 각 자산별 `whale_transfers`는 2017-01 이후 데이터만.
- `news_articles.language IN ('ko', 'en')`
- `news_articles.published_at`이 있는 경우, 해당 이벤트의 `event_date ± 14일` 범위에 들어와야 함 (벗어나면 경고 로그).
- `fear_greed_index.value BETWEEN 0 AND 100`
- `crawl_jobs.status IN ('submitted', 'running', 'done', 'errored', 'cancelled')`

검증 실패 시 적재 중단, 로그에 어느 행에서 실패했는지 명시.

---

## 7. 크롤링 소스 정의 (`pipelines/crawl/sources/*.yaml`)

각 소스는 다음 형식의 YAML로 정의된다. Codex는 새 소스를 추가하기 전에 사용자에게 승인받는다.

```yaml
# pipelines/crawl/sources/coindesk.yaml
id: coindesk
name: CoinDesk
language: en
base_url: https://www.coindesk.com
# Cloudflare /crawl 옵션 템플릿. {date_path}는 이벤트별 ±7일 창에서 치환됨.
crawl_options:
  formats: [markdown]
  limit: 50
  depth: 2
  options:
    includePatterns:
      - "**/{date_path}/**"     # 예: "**/2022/11/**"
    excludePatterns:
      - "**/sponsored/**"
      - "**/podcasts/**"
parser: coindesk_parser         # pipelines/crawl/parsers/coindesk_parser.py
```

```yaml
# pipelines/crawl/sources/tokenpost.yaml
id: tokenpost
name: 토큰포스트
language: ko
base_url: https://www.tokenpost.kr
crawl_options:
  formats: [markdown]
  limit: 30
parser: tokenpost_parser
```

```yaml
# pipelines/crawl/sources/fear_greed.yaml
id: fear_greed
name: Fear & Greed Index
language: en
base_url: https://alternative.me/crypto/fear-and-greed-index/
crawl_options:
  formats: [markdown, html]
  limit: 1
  depth: 0
parser: fear_greed_parser       # 페이지 내 차트 데이터 추출
schedule: per_run               # 이벤트별이 아니라 1회만
```