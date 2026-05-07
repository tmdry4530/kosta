# HANDOFF_PROTOCOL — When Whales Move

> 서브에이전트(DB / Pipeline / Crawler / Backend / Frontend)가 작업을 주고받을 때 따르는 규칙.
> **자연어 장문 핸드오프 금지.** 파일 산출물로만 넘긴다.

---

## 1. 왜 프로토콜이 필요한가

서브에이전트끼리 채팅으로 "이런이런 테이블 만들었으니 너는 이런이런 API 만들어줘" 라고 길게 설명하면:

- 컨텍스트 윈도우 낭비
- 정보 손실 (다음 세션에서 사라짐)
- 같은 설명이 여러 번 반복됨
- 통합 시 "누가 뭘 했는지" 추적 불가

→ **모든 핸드오프는 정해진 파일을 통해서만 한다.**

## 2. 핸드오프 파일 (3종)

```text
.ref/
├── PLAN.md          # 다음 작업 큐. "누가 / 무엇을 / 언제까지"
├── HANDOFF.md       # 직전 단계 → 다음 단계 인수인계서
└── DECISIONS.md     # 영구 의사결정 로그 (덮어쓰지 않음, append-only)
```

### 2.1 `.ref/PLAN.md` — 작업 큐

각 단계의 작업이 모두 끝나면 다음 단계 작업을 적는다. 형식:

```markdown
# PLAN

## Current Stage: Pipeline (in progress)

## Stage: DB ✅ (완료 2026-04-16)
- [x] 0001_init.sql: 8개 테이블 생성
- [x] 0002_indexes.sql: 인덱스 추가
- [x] events 시드 데이터 (EVENTS.md → SQL INSERT)

## Stage: Pipeline 🔵 (진행 중)
- [x] ingest/dune_csv_loader.py
- [ ] transform/whale_transfers.py
- [ ] load/whale_transfers.py
- [ ] event_windows 집계

## Stage: Crawler ⏸ (대기)
- [ ] sources/coindesk.yaml
- [ ] sources/tokenpost.yaml
- ...

## Stage: Backend ⏸
## Stage: Frontend ⏸
```

체크박스 상태:
- `[ ]` 미시작
- `[x]` 완료
- `[~]` 진행 중
- `[!]` 블로킹 (사용자 결정 필요)

### 2.2 `.ref/HANDOFF.md` — 인수인계서

직전 단계가 끝나면 **덮어쓰기**. 다음 단계 에이전트가 가장 먼저 읽는 파일.

```markdown
# HANDOFF

> From: DB Steward → To: Pipeline Engineer
> Date: 2026-04-16
> Status: ready

## What was done
- 8개 테이블 생성 (events, whale_transfers, cex_flows, prices,
  event_windows, news_articles, fear_greed_index, crawl_jobs).
- events 시드 21개 적재 완료. `SELECT count(*) FROM events;` 확인됨.
- 검증: `docker compose up -d db && pnpm --filter api migrate` 통과.

## What's next
- whale_transfers / cex_flows / prices 테이블에 데이터 적재.
- 원본 CSV 위치: `pipelines/data/raw/`.
- 컬럼 매핑은 DATA_SCHEMA.md §2 참조.

## Known issues / Watchouts
- prices 테이블의 BTC 데이터 일부 결측 (2017-01 ~ 2017-03). 보간 여부 결정 필요.
- whale_transfers의 unique_senders 컬럼이 일부 CSV에 없음. NULL 허용으로 처리.

## Verification commands
```bash
docker compose up -d db
pnpm --filter api migrate
psql $DATABASE_URL -c "SELECT count(*) FROM events;"  # → 21
```

## Files changed
- `db/migrations/0001_init.sql` (+342 lines)
- `db/migrations/0002_indexes.sql` (+24 lines)
- `db/seeds/events.sql` (+150 lines)
```

### 2.3 `.ref/DECISIONS.md` — 의사결정 로그 (append-only)

중요한 결정은 **절대 덮어쓰지 않고 추가만** 한다. 한 줄짜리도 OK.

```markdown
# DECISIONS

## 2026-04-16 — DB Steward
- crawl_jobs 테이블에 (event_id, source, submitted_at::date) UNIQUE 제약을 두기로 결정.
  이유: Cloudflare Free 플랜 한도 초과 방지.

## 2026-04-17 — Pipeline Engineer
- BTC 가격 결측구간(2017-01~03)은 NULL 유지, 보간하지 않음.
  이유: 해당 기간에는 분석 대상 이벤트가 없음.

## 2026-04-18 — Backend
- /api/events/:id/window의 days 파라미터 기본값을 7로 고정.
  이유: 모든 분석 윈도우를 ±7일로 통일하기로 한 PRD 결정과 일치.
```

## 3. 단계 전이 체크리스트

각 단계 에이전트가 작업을 "완료" 처리하기 전 **반드시 통과**해야 할 항목.

### 3.1 공통 (모든 단계)
- [ ] 변경한 파일에 대한 검증 명령(lint/typecheck/test)이 모두 통과.
- [ ] `.ref/HANDOFF.md`를 갱신했음 (이전 내용은 덮어씀).
- [ ] `.ref/PLAN.md`의 본인 단계 체크박스를 `[x]`로 바꿨음.
- [ ] 중요 결정이 있었다면 `.ref/DECISIONS.md`에 한 줄 추가.

### 3.2 단계별 추가 게이트

**DB → Pipeline**
- [ ] 모든 마이그레이션이 빈 DB에서 처음부터 끝까지 통과.
- [ ] `events` 시드가 21개 정확히 들어감.

**Pipeline → Crawler**
- [ ] `whale_transfers`, `cex_flows`, `prices` 테이블에 행이 0개가 아님.
- [ ] `event_windows` 집계가 `21 events × 15 days = 315 rows` 정확히 생성됨.

**Crawler → Backend**
- [ ] 21개 이벤트 모두 `news_articles`에 최소 1개 이상의 행 존재.
- [ ] `fear_greed_index`에 이벤트 날짜 21개에 대한 값 존재.
- [ ] `crawl_jobs` 테이블에 모든 job의 status가 `done` 또는 명시적 `errored`.

**Backend → Frontend**
- [ ] 모든 엔드포인트가 200 응답 + 비어있지 않은 데이터 반환.
- [ ] OpenAPI 스펙(또는 README의 엔드포인트 표) 최신화됨.

**Frontend → 사용자 (최종)**
- [ ] 메인 페이지에서 21개 이벤트 마커 모두 보임.
- [ ] 이벤트 클릭 → 사이드 패널에 윈도우 데이터 + 뉴스 헤드라인 렌더.
- [ ] 한국 섹터 탭 작동.

## 4. 에이전트 호출 순서 (이번 프로젝트)

```text
1. DB Steward       → db/migrations + db/seeds
   ↓ HANDOFF.md
2. Pipeline Engineer → pipelines/{ingest,transform,load}
   ↓ HANDOFF.md
3. Crawler          → pipelines/crawl
   ↓ HANDOFF.md
4. Backend          → apps/api
   ↓ HANDOFF.md  (이 시점부터 Frontend 시작 가능)
5. Frontend         → apps/web
```

> **선택적 병렬화**: Backend가 1번째 엔드포인트(/api/events) 완료한 시점부터
> Frontend는 mock data로 스캐폴딩 시작 가능. 다만 본격 통합은 Backend 전체 완료 후.

## 5. 충돌 해결 규칙

서브에이전트 간 의견이 충돌할 때:

1. **루트 AGENTS.md / PRD.md / DATA_SCHEMA.md**가 모든 서브 AGENTS.md보다 우선.
2. 그래도 모호하면 **사용자에게 묻는다**. 임의 결정 금지.
3. 결정 결과는 `.ref/DECISIONS.md`에 기록.

## 6. 영역 침범 금지 규칙

각 서브에이전트는 **자기 영역 밖의 코드를 수정하지 않는다**.
읽기는 허용. 수정이 필요하면 다음 단계 에이전트에게 `HANDOFF.md`로 요청.

| 영역 | 허용 | 금지 |
|---|---|---|
| DB Steward | `db/`, `pipelines/load/seeds/` | API 코드, 프론트 코드 수정 |
| Pipeline Engineer | `pipelines/{ingest,transform,load}/` | 마이그레이션 수정, API/프론트 수정 |
| Crawler | `pipelines/crawl/` | 다른 파이프라인 모듈 수정 (인터페이스만 import) |
| Backend | `apps/api/` | DB 스키마 변경, 프론트 수정 |
| Frontend | `apps/web/` | API 응답 형식 변경, DB 수정 |

위반 시: 해당 변경을 되돌리고 적절한 에이전트에게 `HANDOFF.md`로 요청.

## 7. 첫 PR 템플릿 (각 에이전트 공통)

```markdown
## Stage: [DB / Pipeline / Crawler / Backend / Frontend]

## What this PR does
- (한 문장 요약)

## Files changed
- (영역 안의 파일만 — 영역 밖 파일이 있으면 위반)

## Verification
```bash
(에이전트의 검증 명령)
```
출력: (요약)

## HANDOFF.md updated?
- [ ] yes — `.ref/HANDOFF.md` 갱신함

## Next stage
- 다음 단계 에이전트(누구)에게 무엇을 부탁하는지
```