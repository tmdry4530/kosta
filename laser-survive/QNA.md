# Q&A — Laser Survive

## Q1. 왜 React나 게임 엔진(Phaser 등)을 쓰지 않았나요?

이 프로젝트의 목적 자체가 브라우저 저수준 API를 직접 다루는 것이었습니다. React를 쓰면 DOM 상태 관리는 편해지지만 게임 루프나 Canvas 렌더링은 어차피 직접 구현해야 하고, Phaser 같은 게임 엔진을 쓰면 내부 동작을 추상화해버려서 학습 목적에 맞지 않다고 판단했습니다. 빌드 도구 없이 정적 파일만으로 배포할 수 있다는 실용적인 이점도 있었습니다.

---

## Q2. delta time 방식이 왜 필요한가요?

`requestAnimationFrame`의 호출 간격은 기기 성능에 따라 달라집니다. 60fps 기기와 30fps 기기에서 레이저 타이머를 프레임 수로 세면 게임 속도가 두 배 차이납니다. dt를 모든 연산에 곱하면 경과 시간 기준으로 계산하게 되어 환경에 상관없이 동일한 게임 속도가 보장됩니다.

---

## Q3. Canvas 렌더링과 DOM 렌더링 중 왜 Canvas를 선택했나요?

게임처럼 매 프레임 수십 개의 오브젝트가 위치와 상태를 바꾸는 경우 DOM 업데이트 비용이 큽니다. Canvas는 매 프레임 전체를 다시 그리는 방식이라 DOM 조작이 없어 게임에 더 적합합니다. 파티클처럼 수명이 짧고 많은 오브젝트는 Canvas에서 훨씬 효율적으로 처리됩니다.

---

## Q4. Pursuit 레이저의 이동 직후 즉사 문제를 어떻게 발견했나요?

플레이 테스트 중 이동 키를 눌렀는데 바로 죽는 현상이 반복됐습니다. 로그를 찍어보니 TRACK 단계에서 플레이어가 이동한 직후 새 위치로 타겟이 갱신되고, WARNING 발동 후 거의 즉시 FIRE로 전환되는 타이밍이 겹쳐서 생기는 문제였습니다. `performance.now()`로 마지막 이동 시간을 기록하고, 이동 후 일정 시간 동안 인접 칸을 타겟에서 제외하는 방식으로 해결했습니다.

---

## Q5. IndexedDB를 선택한 이유가 있나요? localStorage로도 충분하지 않나요?

localStorage는 동기 API라 게임 루프 중 호출하면 메인 스레드를 블로킹할 수 있습니다. IndexedDB는 비동기 API라 게임 실행에 영향을 주지 않습니다. 또 localStorage는 문자열만 저장하는데 IndexedDB는 구조화된 데이터를 직접 저장해서 직렬화/역직렬화 비용도 없습니다.

---

## Q6. Crazy 모드를 `getDifficultyTime() + 180`으로 구현한 발상은 어디서 왔나요?

처음에는 Crazy 모드 전용 난이도 파라미터를 별도로 관리하려 했는데, 결국 Endless 모드의 난이도 곡선을 그대로 재활용하면서 시작 지점만 다르게 잡는 방식이 훨씬 깔끔하다는 걸 알았습니다. 기존 스케일링 로직을 전혀 건드리지 않고 모드 하나를 추가할 수 있어서 유지보수도 쉽습니다.

---

## Q7. 가장 어려웠던 구현은 무엇인가요?

그리드 축소와 복구의 균형 잡기가 가장 까다로웠습니다. 복구가 너무 빠르면 레이저 압박이 무의미해지고, 너무 느리면 그리드가 순식간에 사라져서 게임이 끊깁니다. 현재 그리드 크기를 기준으로 복구 딜레이를 동적으로 조정하고, 아이템 출현 확률도 연동하는 구조로 수십 번의 플레이 테스트를 거쳐 지금의 수치에 도달했습니다.

---

## Q8. 파티클 시스템은 어떻게 성능 문제 없이 구현했나요?

파티클은 오브젝트 풀 개념으로, 수명이 다한 파티클은 즉시 배열에서 제거합니다. Canvas 렌더링 자체가 매 프레임 전체를 다시 그리는 구조라 파티클 수가 적을 때는 DOM 방식보다 오히려 빠릅니다. 또 파티클 크기가 작고 단순한 원/사각형이라 드로우 콜 비용이 낮습니다.

---

## Q9. 온라인 랭킹에 Supabase를 선택한 이유는?

간단한 리더보드 용도로 별도 서버를 구축하는 건 과한 선택이었습니다. Supabase는 PostgreSQL 기반 BaaS로, Row Level Security와 REST API가 기본 제공되어 별도 백엔드 없이 랭킹 제출/조회를 구현할 수 있었습니다. Vercel과 함께 완전 서버리스 배포가 가능하다는 점도 이유였습니다.

---

## Q10. Normal / Pursuit / Sweep 레이저의 타겟 선택 방식이 각각 어떻게 다른가요?

세 타입이 모두 다릅니다.

**Normal**은 현재 플레이어 위치에 가까운 행/열에 가중치를 두어 랜덤하게 타겟을 선택합니다. 완전한 랜덤이 아니라 플레이어 주변에 더 자주 쏘도록 설계되어 있고, 발사 즉시 해당 줄이 그리드에서 제거됩니다.

**Pursuit**는 QUEUED → TRACK → WARNING → FIRE 4단계를 거칩니다. TRACK 단계(약 1초) 동안은 매 프레임 `getLiveTrackedIndex()`를 호출해 플레이어의 현재 위치를 실시간으로 추적하며 타겟이 바뀝니다. WARNING으로 전환되는 순간 `lockedOn = true`로 타겟을 고정하고, 그 이후에는 플레이어가 이동해도 타겟이 따라오지 않습니다. 줄 제거는 없고 플레이어에게만 피해를 줍니다.

**Sweep**는 연속된 인접 줄을 순차적으로 선택합니다. `chooseSweepTarget()`이 이전에 선택한 줄과 다른 축(행↔열)을 교차로 고르고, Crazy 모드에서는 `getPredictedPlayerPosition()`으로 플레이어가 이동할 방향까지 예측해서 타겟을 잡습니다.

---

## Q11. 각 레이저 타입은 언제부터, 얼마나 자주 등장하나요?

타입마다 등장 조건과 빈도가 다르게 설계되어 있습니다.

**Normal**은 게임 시작 3초 후부터 항상 등장합니다. 발사 간격은 Endless 기준 초기 2.8초에서 시작해 매 라운드마다 스케일링 팩터(0.96~0.978)를 곱하며 점점 짧아집니다. Crazy 모드는 초기 간격이 1.2초로 시작합니다.

**Pursuit**는 Crazy 모드 전용입니다. Endless에서는 등장하지 않습니다.
- 30초 이후: 28% 확률로 레이저 묶음에 1개 포함
- 60초 이후: 38% 확률로 2개 포함
- 최종 페이즈(75~90초): 모든 레이저가 Pursuit로 고정

**Sweep**는 Endless 모드에서 `difficultyTime`이 120초를 넘어야 독립 타이머로 활성화됩니다. 발사 간격은 7~11초이며, 150초 이후에는 5.5~8.5초로 짧아집니다. Crazy 최종 페이즈에서는 1.1~1.7초로 극단적으로 빨라집니다.

| 타입 | 첫 등장 조건 | 발사 간격 |
|------|------------|---------|
| Normal | 게임 시작 3초 후 | 2.8s → 최소 0.60s (점진 감소) |
| Pursuit | Crazy 모드, 30초 이후 확률 | Normal 타이머에 편승 |
| Sweep | Endless, difficultyTime 120초 이후 | 7~11s (후반 5.5~8.5s) |

---

## Q12. Pursuit 레이저가 WARNING 단계에서도 타겟이 고정되지 않는 것처럼 보이는 경우가 있던데, 의도된 동작인가요?

의도된 동작입니다. TRACK 단계에서 WARNING으로 전환될 때 `lockedOn = true`가 세팅되어 타겟이 고정됩니다. 하지만 WARNING 경고 시간이 0.45초로 짧기 때문에, TRACK 중에 플레이어가 이동하면 거의 즉시 새 위치로 경고가 뜨는 것처럼 느껴질 수 있습니다.

실제로는 `updateTrackingLasers()`가 `lockedOn`이 `false`인 레이저에 대해서만 추적을 갱신하므로, WARNING 전환 이후에는 절대로 타겟이 바뀌지 않습니다. 플레이어 입장에서 경고 표시가 뜬 순간 이미 위치를 이동했다면 안전합니다.

---

## Q13. 충돌 감지를 왜 격자 좌표 비교로만 처리했나요? 더 정교한 방식이 필요하지 않나요?

게임의 모든 오브젝트가 정렬된 격자 좌표에만 존재하기 때문에 논리적으로 충돌 판정도 격자 기준으로 충분합니다. 레이저 발사 순간 플레이어의 `x`, `y`와 레이저 인덱스를 비교하는 O(1) 연산입니다.

```javascript
const hit = (laser.isVertical && this.player.x === laser.index)
  || (!laser.isVertical && this.player.y === laser.index);
```

원형 충돌(circular collision)이나 AABB 같은 방식은 오버킬입니다. 오히려 "정확히 같은 줄에 있으면 피할 수 없다"는 명확한 규칙이 플레이어에게 직관적이고, 게임 디자인 의도와도 일치합니다.

---

## Q14. 스크린 쉐이크는 어떻게 구현했나요?

`screenShake` 값을 dt 기반으로 선형 감쇠시키고, 매 프레임 Canvas를 무작위 오프셋으로 translate합니다.

```javascript
// update: 선형 감쇠
if (this.screenShake > 0) this.screenShake -= dt * 10;

// draw: 무작위 진동
if (this.screenShake > 0) {
  const dx = (Math.random() - 0.5) * this.screenShake;
  const dy = (Math.random() - 0.5) * this.screenShake;
  this.ctx.translate(dx, dy);
}
```

SWEEP은 초기값 2.5, NORMAL은 4로 같은 로직에서 강도 차이를 줍니다. 구현이 단순하지만 게임 루프 오버헤드가 거의 없고, 충격감 전달에 충분합니다.

---

## Q15. 키 입력 버퍼링(nextMove)이 있던데, 단순 입력 처리와 어떻게 다른가요?

이동 쿨타임(150ms) 중에 키를 누르면 `nextMove`에 저장해뒀다가 다음 프레임에 즉시 실행합니다. 단순히 반응성을 높이는 것 이상으로, `getPredictedPlayerPosition()`이 `getDesiredMovementVector()`를 통해 `nextMove`를 읽기 때문에 **Pursuit 레이저의 타게팅이 플레이어의 입력 의도를 미리 감지합니다.**

```javascript
getDesiredMovementVector() {
  if (this.nextMove) return this.nextMove;  // 버퍼 입력 우선
  // 현재 누르고 있는 키 읽기
}
```

즉, 이동 키를 누르는 순간 Pursuit가 그 방향을 예측해서 타게팅합니다. 플레이어가 단순 반사로 도망치면 오히려 더 위험해지는 구조입니다.

---

## Q16. 아이템이 스폰된 후 그리드가 줄어들면 어떻게 처리하나요?

매 프레임 `validateItemPlacement()`로 아이템이 아직 활성 셀 위에 있는지 확인하고, 격자 밖으로 밀려나면 즉시 `relocateItem()`으로 이동합니다. 흥미로운 부분은 안전한 칸이 없는 극한 상황의 fallback 로직입니다 — 마지막 수단으로 플레이어가 있는 칸도 선택 가능하게 합니다(`excludePlayer: false`). 격자가 1×1이 되어도 아이템이 사라지지 않도록 하는 안전장치입니다.

---

## Q17. leaderboardApi와 rewardApi를 왜 분리했나요?

두 API의 권한 구조가 다르기 때문입니다.

**leaderboardApi**는 Supabase RLS(Row Level Security)로 보호된 테이블에 REST API를 직접 호출합니다. 익명 사용자도 읽기/쓰기가 가능하게 열어둔 구조입니다.

**rewardApi**는 Supabase Cloud Functions를 거칩니다. 이미 클레임한 기기 차단, 보상 에셋의 signed URL 발급 같은 서버 사이드 로직이 필요하기 때문입니다. 직접 REST API로 열어두면 누구나 제약 없이 보상을 받을 수 있으므로, 반드시 함수를 통해야 합니다.

| 구분 | 방식 | 이유 |
|------|------|------|
| leaderboardApi | Supabase REST (RLS) | 공개 읽기/쓰기, 서버 로직 불필요 |
| rewardApi | Cloud Functions | 중복 클레임 방지, signed URL 발급 |

---

## Q18. 테스트에서 Node.js 내장 `test` 모듈을 쓴 이유는? Jest나 Vitest를 안 쓴 이유가 있나요?

프로젝트 철학과의 일관성 때문입니다. 빌드 도구 없이 순수 JavaScript만 사용하는 프로젝트에서 Jest나 Vitest를 추가하면 외부 의존성이 생깁니다. Node 18+ 내장 `test` 모듈로 충분했습니다.

구현상 흥미로운 부분은 두 가지입니다. 첫째, 각 테스트가 동적 import에 타임스탬프를 붙여 모듈 캐시를 무효화합니다(`?test=${Date.now()}`). 둘째, `installBrowserMocks()`로 `performance.now()`와 `requestAnimationFrame`을 메모리에 구현해 순수 Node 환경에서 게임 엔진을 테스트합니다. 브라우저 API에 의존하는 코드를 외부 라이브러리 없이 테스트하는 방법이었습니다.

---

## Q19. Crazy 모드의 HUNT, PINCER, BOX 웨이브 타입은 각각 어떤 전략인가요?

각 웨이브는 플레이어 움직임을 다른 방식으로 제약하는 공간 전략입니다.

**HUNT** — 플레이어에게 가장 가까운 줄들을 집중 타게팅합니다. 이동 방향과 일치하는 타겟에 가중치를 줘서, 도망치는 방향이 오히려 더 위험해집니다.

**PINCER** — 플레이어 양옆(`offset ± 1`)을 집중 타게팅합니다. 좌우 이동이 막히고 앞뒤로만 도망칠 수 있게 됩니다.

**BOX** — 플레이어 주변 3칸 범위를 고르게 포위합니다. 어느 방향으로도 움직임이 위험해지는 가장 극한 전략이며, 레이저 6개 이상이면 자동으로 BOX가 강제됩니다.

---

## Q20. getPredictedPlayerPosition의 lead 값이 laserIndex에 따라 달라지는데, 왜 그렇게 설계했나요?

묶음으로 발사되는 레이저들이 플레이어의 "예상 회피 경로 전체"를 커버하도록 설계했습니다.

```javascript
const lead = Math.min(3, Math.max(1, laserIndex));
// laserIndex 0 → 1칸 앞, laserIndex 1 → 2칸 앞, laserIndex 2+ → 3칸 앞
```

첫 번째 레이저는 현재 위치 바로 앞을, 이후 레이저들은 점점 더 멀리 앞을 타게팅합니다. 플레이어가 반사적으로 계속 같은 방향으로 이동하면 연속 레이저들이 그 경로를 순서대로 차단합니다. 또한 laserCount가 3 미만이면 예측 자체를 하지 않습니다 — 단발/쌍발 레이저는 예측 없이도 충분히 위협적이기 때문입니다.

---

## Q21. Supabase anon key가 브라우저에 그대로 노출되는데 보안 문제가 없나요?

anon key는 원래 공개 설계입니다. Supabase의 보안 모델은 키 자체가 아니라 **Row Level Security(RLS)**에 의존합니다. anon key는 "이 프로젝트의 익명 요청"임을 식별하는 역할만 하고, 실제 데이터 접근 권한은 RLS 정책이 제어합니다.

이 프로젝트의 RLS 정책을 보면:
- `scores` 테이블: 읽기는 `is_test_mode = false`인 행만, 쓰기는 `submit_score()` RPC 함수 통해서만
- `reward_claims` 테이블: 직접 읽기 완전 차단 (`using (false)`)
- `rewards` 테이블: `active = true`인 메타데이터만 읽기 허용

anon key를 알아도 RLS를 우회할 수 없고, 보상 관련 민감한 데이터는 Edge Function을 통해서만 접근 가능합니다.

---

## Q22. 점수 제출을 REST INSERT가 아닌 `submit_score()` RPC 함수로 구현한 이유는?

두 가지 이유입니다.

첫째, **INSERT와 랭킹 조회를 원자적으로 처리**해야 합니다. 점수를 저장하는 동시에 현재 순위와 개인 최고 기록 여부를 반환해야 하는데, REST INSERT는 삽입된 행만 반환할 수 있어 별도 SELECT가 필요합니다. `submit_score()` 함수는 INSERT 후 즉시 `count(*) + 1`로 랭킹을 계산해 반환합니다.

둘째, **서버 사이드 입력 검증**입니다. RLS의 `with check`는 단순 조건만 가능하지만, `security definer` 함수 안에서는 테스트 모드 차단, 플레이어명 정규식 검증, survival_time 범위 체크 등 복잡한 검증 로직을 작성할 수 있습니다.

---

## Q23. 보상 중복 클레임 방지를 어떻게 구현했나요?

`claim_reward()` DB 함수에서 `ON CONFLICT DO NOTHING` + LOOP 패턴으로 race condition까지 방지합니다.

```sql
loop
  -- 미클레임 보상 하나 선택
  select * into v_reward from rewards where ... and not exists (select 1 from reward_claims where reward_id = rewards.id)
  order by random() limit 1;

  -- INSERT 시도, 동시 요청이 이미 삽입했으면 무시
  insert into reward_claims (...) on conflict do nothing returning id into v_inserted_claim_id;

  if v_inserted_claim_id is not null then
    return 'claimed';  -- 성공
  end if;

  -- 내가 이미 클레임했으면 'already_claimed' 반환
  select * into v_existing from reward_claims where mode = p_mode and device_id_hash = p_device_id_hash;
  if found then return 'already_claimed'; end if;
  -- 아니면 다른 보상으로 재시도 (loop)
end loop;
```

동시에 두 요청이 같은 보상을 잡으려 하면 한 쪽은 `ON CONFLICT DO NOTHING`으로 실패하고 루프를 돌며 다음 보상을 시도합니다. DB 트랜잭션 레벨에서 중복을 막기 때문에 Edge Function 레벨 lock 없이도 안전합니다.

---

## Q24. deviceId를 클라이언트가 그대로 보내지 않고 Edge Function에서 SHA-256으로 해싱하는 이유는?

`deviceId`는 `crypto.randomUUID()`로 생성해 localStorage에 저장하는 식별자입니다. 이 값을 DB에 평문으로 저장하면 `reward_claims` 테이블이 탈취됐을 때 다른 사람의 deviceId가 노출됩니다. SHA-256 해시로 저장하면 원본 UUID를 역산할 수 없어 개인 식별 위험이 없습니다.

해싱은 Edge Function 안에서만 일어납니다. 클라이언트는 원본 UUID를 보내고, 서버가 해싱해서 저장하므로 클라이언트 측 해싱 조작으로 중복 클레임을 우회할 수 없습니다.

```typescript
function hashDeviceId(deviceId: string) {
  const encoder = new TextEncoder()
  return crypto.subtle.digest('SHA-256', encoder.encode(deviceId))
    .then((buffer) => Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, '0')).join(''))
}
```

---

## Q25. 보상 에셋을 Storage URL로 직접 노출하지 않고 signed URL을 쓰는 이유는?

Storage를 public으로 열면 누구나 URL만 알면 보상 에셋에 접근할 수 있습니다. signed URL은 **60초 만료 토큰**이 포함된 임시 URL로, `reward-asset` Edge Function이 이미 클레임한 기기(`reward_claims` 테이블 확인)에게만 발급합니다.

```typescript
const { data: signed } = await supabase.storage
  .from('reward-assets')
  .createSignedUrl(reward.storage_path, 60)  // 60초 후 만료
```

조건을 통과해야만 URL이 발급되고, 발급된 URL도 60초 이후에는 무효가 되므로 클레임하지 않은 사용자는 에셋에 접근할 수 없습니다.

---

## Q26. Supabase SDK를 쓰지 않고 `fetch`로 직접 REST API를 호출한 이유는?

프로젝트 전체 철학과 일관성을 맞추기 위해서입니다. 빌드 도구 없이 정적 파일만으로 배포하는 구조에서 npm 패키지를 import하면 번들러가 필요해집니다. `fetch`로 직접 호출하면 외부 의존성 없이 동일한 기능을 구현할 수 있습니다.

Supabase REST API는 명세가 단순합니다. 헤더에 `apikey`와 `Authorization: Bearer`를 붙이고, RPC는 `/rest/v1/rpc/함수명`, 테이블 조회는 `/rest/v1/테이블명?쿼리파라미터` 형태입니다. SDK가 감싸주는 편의 메서드가 없어도 직접 작성한 `requestSupabase()` 래퍼로 충분히 대체됩니다.

---

## Q27. scores 테이블에 인덱스를 두 개 만든 이유는?

두 쿼리 패턴이 달라서 각각 최적화했습니다.

```sql
-- 랭킹 조회용: 모드별로 점수 내림차순 정렬
create index idx_scores_mode_rank on scores (mode, survival_time desc, created_at asc);

-- 개인 최고 기록 조회용: 플레이어명 + 모드 기준 집계
create index idx_scores_player_best on scores (player_name, mode, survival_time desc);
```

`fetchLeaderboard()`는 특정 모드의 상위 N개를 가져오는 쿼리이므로 `(mode, survival_time DESC)` 복합 인덱스가 필요합니다. `player_best()`는 플레이어명으로 필터링 후 모드별 MAX를 집계하므로 `(player_name, mode)` 인덱스가 효율적입니다. 하나의 인덱스로 두 쿼리를 커버하려면 선행 컬럼이 달라서 분리했습니다.

---

## Q28. 이 프로젝트에서 배운 점은 무엇인가요?

세 가지를 꼽겠습니다. 첫째, requestAnimationFrame과 delta time 방식이 왜 게임 루프의 표준인지 몸으로 이해했습니다. 둘째, 난이도 설계는 수치가 아니라 플레이어 경험의 문제라는 걸 알았습니다. 숫자를 올리는 건 쉽지만 "어렵지만 불공평하지 않다"는 느낌을 만드는 건 많은 반복 테스트가 필요했습니다. 셋째, 프레임워크 없이 구현해보면서 프레임워크가 해결해주는 문제가 무엇인지 명확하게 이해하게 됐습니다.
