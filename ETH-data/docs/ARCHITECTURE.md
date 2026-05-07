# ARCHITECTURE — When Whales Move

> 시스템 구조와 데이터 플로우. Codex가 모듈 간 책임 경계를 흐트러뜨리지 않도록 한다.

---

## 1. 전체 구조 (High-Level)

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                          외부 데이터 소스                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐ │
│  │ Dune CSV     │ │ CoinGecko    │ │ EVENTS.md    │ │ 웹 (뉴스/지수)   │ │
│  │ (주간 고래)   │ │ (ETH/BTC 가격)│ │ (수동 큐레)   │ │ - CoinDesk      │ │
│  │              │ │              │ │              │ │ - Cointelegraph │ │
│  │              │ │              │ │              │ │ - 토큰포스트       │ │
│  │              │ │              │ │              │ │ - 블록미디어       │ │
│  │              │ │              │ │              │ │ - alternative.me│ │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └────────┬────────┘ │
└─────────┼────────────────┼────────────────┼──────────────────┼──────────┘
          │                │                │                  │
          │                │                │                  ▼
          │                │                │       ┌──────────────────────┐
          │                │                │       │ Cloudflare           │
          │                │                │       │ Browser Rendering    │
          │                │                │       │ /crawl (오픈 베타)    │
          │                │                │       │ - robots.txt 자동 준수│
          │                │                │       │ - Markdown 출력       │
          │                │                │       │ - 비동기 job          │
          │                │                │       └──────────┬───────────┘
          │                │                │                  │ Markdown/JSON
          ▼                ▼                ▼                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     pipelines/  (Python 3.11)                            │
│   ingest/  →  crawl/ (수집·파싱)  →  transform/  →  load/                  │
│   - Dune CSV 파싱                                                        │
│   - 가격 데이터 정규화                                                     │
│   - 크롤 결과 → 정규화 (제목, 발행일, 소스, 감성 태그)                      │
│   - 이벤트 시드 생성                                                       │
│   - 윈도우 집계 (이벤트 ±N일)                                              │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │ SQLAlchemy
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  PostgreSQL 16 (Source of Truth)                         │
│   events │ whale_transfers │ cex_flows │ prices │ event_windows         │
│   news_articles │ fear_greed_index                                       │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │ pg / postgres.js
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  apps/api/  (Node.js 20 + Fastify + TS)                  │
│   GET /api/events                                                        │
│   GET /api/events/:id/window                                             │
│   GET /api/events/:id/news                                               │
│   GET /api/whale-flows  /  /api/cex-flows  /  /api/prices                │
│   GET /api/fear-greed                                                    │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │ HTTP (JSON)
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  apps/web/  (React 18 + Vite + TS)                       │
│   - 메인 타임라인 뷰 (고래 + F&G 오버레이)                                  │
│   - 이벤트 디테일 패널 (당시 헤드라인 함께 표시)                            │
│   - 카테고리 비교 뷰                                                       │
│   - 한국 섹터 뷰                                                          │
│   시각화: Recharts (1차 선택), 필요 시 Visx로 전환                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## 2. 컴포넌트 책임 경계 (중요)

| 레이어 | 하는 것 | 하지 않는 것 |
|---|---|---|
| `pipelines/ingest/` | API/CSV 기반 데이터 수집 | 웹 페이지 스크레이핑 |
| `pipelines/crawl/` | Cloudflare `/crawl`로 웹 페이지 수집 + 파싱 | 자체 헤드리스 브라우저 운용 |
| `pipelines/transform/` | 정제/집계 후 정규화 | 외부 호출 |
| `pipelines/load/` | DB에 적재 | 비즈니스 로직 |
| `db/` | 스키마 정의, 시드 SQL | 비즈니스 로직 (트리거 최소화) |
| `apps/api/` | DB 조회, JSON 직렬화, 캐싱 | 데이터 가공/계산 (이미 집계된 결과만 반환) |
| `apps/web/` | 시각화, 인터랙션, 카피 | API 호출 외 외부 통신 |

**핵심 원칙**: 무거운 계산은 모두 파이프라인에서 미리 한다. API는 "이미 만들어진 답"을 꺼내 줄 뿐.

## 3. 데이터 플로우 (단계별)

### Stage 1 — 수집 (`pipelines/ingest/`)

```python
# 입력: data/raw/*.csv (이미 다운로드됨), CoinGecko API
# 출력: 메모리 DataFrame
```

- `dune_csv_loader.py`: 10개 CSV를 읽어 단일 DataFrame으로 통합.
- `price_loader.py`: ETH/BTC 일별 가격 로드.
- `cex_flow_loader.py`: 거래소 입출금 데이터 로드.

### Stage 1.5 — 크롤링 (`pipelines/crawl/`)

> Cloudflare Browser Rendering의 `/crawl` 엔드포인트 사용.
> **이벤트 ±7일 창**으로만 크롤한다 (전체 기간 크롤 금지).

```python
# 입력: events 테이블 + sources/*.yaml (소스별 시드 URL/패턴)
# 출력: data/crawled/*.json + DB (news_articles, fear_greed_index)
```

흐름:

1. **Job 제출** (`pipelines/crawl/jobs/submit_all.py`)
   - 각 (event × source) 조합에 대해 Cloudflare에 POST `/browser-rendering/crawl`
   - 응답으로 받은 `job_id`를 `crawl_jobs` 테이블에 기록 (재시도/추적용)
   - 옵션 예: `{ "url": "https://www.coindesk.com/", "limit": 50, "formats": ["markdown"], "options": { "includePatterns": ["**/2022/11/**"] } }`

2. **결과 수집** (`pipelines/crawl/jobs/collect.py`)
   - `crawl_jobs`에서 미완료 job을 조회 → GET `/browser-rendering/crawl/{job_id}`
   - 완료된 결과(Markdown)를 `data/crawled/{event_id}/{source}_{job_id}.json`에 저장
   - job 상태를 `done` / `errored` / `cancelled`로 업데이트

3. **파싱** (`pipelines/crawl/parsers/`)
   - 소스별 파서가 Markdown을 읽어 `{title, published_at, summary, url, source}` 추출
   - `coindesk_parser.py`, `tokenpost_parser.py`, `cointelegraph_parser.py` 등
   - 파싱 실패 시 raw Markdown은 보존, 실패 로그에 기록

4. **공포·탐욕 지수**: `pipelines/crawl/sources/fear_greed.py`는 `https://alternative.me/crypto/fear-and-greed-index/` 페이지를 `/crawl`로 한 번 가져와 히스토리 차트 데이터를 추출.

크롤은 **수동 트리거**다. 이벤트가 새로 추가되거나 사용자가 명시적으로 재실행할 때만 돈다.

### Stage 2 — 정제/집계 (`pipelines/transform/`)

```python
# 입력: 정제 전 DataFrame
# 출력: DB 적재 가능한 정규화된 DataFrame
```

- `whale_transfers.py`: 컬럼명 통일, USD 환산, 자산별 분류, 주차(week) 키 생성.
- `event_windows.py`: 각 이벤트의 ±7일 윈도우에 해당하는 주간 데이터를 미리 집계.
- `cex_direction.py`: 입금/출금 방향 분류 후 일별 집계.

### Stage 3 — 적재 (`pipelines/load/`)

```python
# 입력: 정규화된 DataFrame
# 출력: PostgreSQL 테이블 (UPSERT)
```

- `events.py`: `EVENTS.md`에서 파싱한 이벤트 메타데이터를 `events` 테이블에 UPSERT.
- `whale_transfers.py`: `whale_transfers` 테이블에 UPSERT.
- `cex_flows.py`: `cex_flows` 테이블에 UPSERT.
- `prices.py`: `prices` 테이블에 UPSERT.
- `event_windows.py`: `event_windows` 집계 테이블에 UPSERT.

### Stage 4 — 서빙 (`apps/api/`)

- 요청을 받으면 단순 SELECT.
- 5분 인메모리 LRU 캐시.
- 응답은 카멜케이스 JSON.

### Stage 5 — 시각화 (`apps/web/`)

- React Query로 API 호출 + 캐싱.
- Recharts로 시계열 + 이벤트 마커 오버레이.
- 이벤트 클릭 시 라우팅하지 않고 사이드 패널 토글 (URL은 query param 동기화).

## 4. DB 테이블 개요

세부 컬럼은 `DATA_SCHEMA.md` 참조. 여기서는 관계만:

```text
events (1) ──┬── (N) event_windows  ─── 미리 집계된 ±7일 데이터
             │
             ├── (N) news_articles  ─── 크롤로 수집한 헤드라인 (event_id FK)
             │
             └── (N) event_tags      ─── 카테고리 태깅 (M:N)

whale_transfers      ── (주간 시계열, 자산별)
cex_flows            ── (일별, 입금/출금 방향)
prices               ── (일별, 자산별)
fear_greed_index     ── (일별, 0~100 지수)
crawl_jobs           ── (Cloudflare /crawl job 추적)
```

## 5. 환경 변수

```bash
# .env (커밋 금지)
DATABASE_URL=postgresql://whales:whales@localhost:5432/whales
DUNE_API_KEY=...                       # 추가 쿼리 시에만
COINGECKO_API_KEY=...                  # Pro 키가 있으면

# Cloudflare Browser Rendering /crawl
CLOUDFLARE_ACCOUNT_ID=...              # 대시보드에서 확인
CLOUDFLARE_API_TOKEN=...               # Browser Rendering: Edit 권한
CLOUDFLARE_CRAWL_BASE_URL=https://api.cloudflare.com/client/v4

# apps/web/.env
VITE_API_BASE_URL=http://localhost:3001
```

`.env.example`은 항상 커밋. 실제 `.env`는 `.gitignore`.

> Cloudflare 토큰 권한: `Account → Browser Rendering → Edit` 만 부여. 다른 스코프는 주지 않는다.

## 6. 로컬 개발 (Quickstart)

```bash
# 1. PostgreSQL 띄우기
docker compose up -d db

# 2. 의존성 설치
pnpm install                   # Node 워크스페이스 전체
cd pipelines && uv sync        # Python

# 3. DB 스키마 + 시드
pnpm --filter api migrate
cd pipelines && uv run python -m pipelines.load.events

# 4. 데이터 적재 (API/CSV 기반)
cd pipelines && uv run python -m pipelines.run_all

# 5. 크롤링 (선택, 시간 소요)
cd pipelines
uv run python -m pipelines.crawl.jobs.submit_all       # 모든 (event × source) job 제출
# ... Cloudflare 측에서 비동기 처리 (수 분~수십 분) ...
uv run python -m pipelines.crawl.jobs.collect          # 결과 수집 + DB 적재

# 6. 개발 서버
pnpm dev                       # web + api 동시 실행
```

## 7. 배포 (선택)

학교 발표용으로만:
- **DB**: Supabase 무료 티어 또는 Neon
- **API**: Render 무료 또는 Railway
- **Web**: Vercel 무료
- 또는 모두 로컬 + 발표 시 데모 영상 첨부

자동 배포는 범위 외. 수동 배포만.

## 8. 디렉토리 책임 매트릭스

| 디렉토리 | Owner | 변경 빈도 | 검증 명령 |
|---|---|---|---|
| `pipelines/ingest/` | 데이터 엔지니어 | 수집 소스 변경 시 | `uv run pytest pipelines/ingest` |
| `pipelines/crawl/` | 데이터 엔지니어 | 새 소스 추가 시 | `uv run pytest pipelines/crawl` |
| `pipelines/transform/` | 데이터 엔지니어 | 자주 (분석 로직 진화) | `uv run pytest pipelines/transform` |
| `db/migrations/` | 백엔드 | 신중하게 | 새 파일 추가만 |
| `apps/api/src/routes/` | 백엔드 | 엔드포인트 추가 시 | `pnpm --filter api test` |
| `apps/web/src/features/` | 프론트엔드 | 자주 | `pnpm --filter web test` |
| `EVENTS.md` | PM (사용자) | 매우 드물게 | 사용자 컨펌 필수 |

## 9. 향후 확장 여지 (out of scope but considered)

- 비트코인 체인 데이터 추가 → 새 파이프라인 모듈만 추가하면 됨.
- 실시간 적재 → 현재 배치 구조에 cron만 얹으면 됨.
- 사용자 노트 기능 → 새 테이블 + 인증만 붙이면 됨.

레이어 분리를 지키고 있는 한, 위 확장은 모두 비파괴적으로 가능하다.