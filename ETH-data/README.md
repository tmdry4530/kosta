# When Whales Move

> 이더리움 온체인 데이터로 시장 이벤트 전후 고래 자금 흐름을 읽는 데이터 분석 프로젝트

고래 송금 데이터, 거래소 입출금 흐름, ETH 가격, 이벤트 메타데이터, 뉴스 헤드라인을 함께 묶어
**"사건이 터졌을 때 큰 자금은 어떻게 움직였는가"**를 비교해 보는 프로젝트입니다.

복잡한 온체인 지표를 그대로 나열하기보다,
이벤트 기준 **전후 7일 변화**를 한 화면에서 볼 수 있게 만드는 데 집중했습니다.

## 프로젝트 의도

가격 차트만 보면 사건의 맥락이 잘 보이지 않을 때가 많았습니다.
그래서 이 프로젝트는

- 시장 이벤트를 기준점으로 잡고
- 고래 자금 이동을 비교하고
- 그 결과를 API와 대시보드로 정리하는

작은 분석 시스템으로 만들었습니다.

## 핵심 기능

### 데이터 분석
- 2017 ~ 2026 구간의 ETH 관련 이벤트 21개 정리
- 이벤트별 **±7일 윈도우** 기준 자금 흐름 비교
- whale transfers / cex inflow / cex outflow / price 데이터 통합
- 뉴스 헤드라인을 보조 신호로 함께 제공

### API
- 이벤트 목록 조회
- 이벤트별 윈도우 데이터 조회
- 이벤트별 뉴스 조회
- 시계열 데이터 조회

### 대시보드
- 메인 타임라인
- 이벤트 상세 패널
- 카테고리 비교 뷰
- 한국 이벤트 분리 뷰

## 데이터 규모

| 항목 | 규모 |
| --- | ---: |
| Events | 21 |
| Whale transfers | 1,286 rows |
| CEX flows | 15,393 rows |
| Prices | 6,330 rows |
| Event windows | 315 rows |

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Pipeline | Python, SQLAlchemy |
| Database | PostgreSQL |
| API | Fastify, TypeScript, Zod |
| Web | React, Vite, TanStack Query, Recharts |
| Infra | Docker Compose |

## 구조

```text
ETH-data/
├── apps/
│   ├── api/        # Fastify API
│   └── web/        # React dashboard
├── db/             # migration / seed
├── docs/           # architecture / schema / events
├── pipelines/      # Python ETL + crawl
├── whale_data/
├── exchange_flow_data/
├── price_data/
└── README.md
```

## 실행 방법

```bash
# 1) install
npm --prefix apps/api install
npm --prefix apps/web install
cd pipelines && uv sync

# 2) database
cd ..
docker compose up -d db
psql postgresql://whales:whales@localhost:5432/whales -f db/migrations/0001_init.sql
psql postgresql://whales:whales@localhost:5432/whales -f db/migrations/0002_indexes.sql
psql postgresql://whales:whales@localhost:5432/whales -f db/seeds/events.sql

# 3) load data
cd pipelines
uv run python -m pipelines.run_all

# 4) run app
cd ..
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:3001`
- API Docs: `http://localhost:3001/docs`

## 주요 명령어

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## 한 줄 요약

**When Whales Move**는 시장 이벤트를 기준으로 고래 자금 흐름을 읽기 쉽게 정리한 데이터 파이프라인 + API + 대시보드 프로젝트입니다.
