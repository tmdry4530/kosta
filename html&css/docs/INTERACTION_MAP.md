# 상태 기반 CSS 매핑 테이블

이 문서는 “사용자 액션 → CSS 상태 → 시각 결과”를 **수학적 표기 + selector 표기**로 정리한다.  
Velocity Vault의 모든 인터랙션은 아래 식으로 설명 가능해야 한다.

```text
Visual Output = f(Persistent State, Transient Context, Scroll Progress)
```

여기서,

- `Persistent State` = radio/checkbox의 `:checked`
- `Transient Context` = `:has(.hover-cell:hover)`, `:focus-visible`
- `Scroll Progress` = `animation-timeline`이 공급하는 0% ~ 100%

---

## 1. 표기 규칙

### 1.1 상태 기호
- `V` = View state
- `T` = Theme state
- `P` = Paint state
- `C` = Camera state
- `E` = Edition state
- `X` = Explode state
- `H` = Hover context
- `S` = Scroll progress, `0 ≤ S ≤ 1`

### 1.2 selector 환산 규칙
- `V = story`  → `#view-story:checked`
- `T = blueprint` → `#theme-blueprint:checked`
- `P = red` → `#color-red:checked`
- `C = top` → `#camera-top:checked`
- `X = on` → `#explode-on:checked`
- `E = founder` → `#edition-founder:checked`
- `H = aero.ne` → `.knowledge-stage:has(.card--aero .hover-cell--ne:hover)`

### 1.3 렌더 타깃 표기
- `R(view.story)` → `.view--story`
- `R(model)` → `.product-3d-model`
- `R(card.*)` → `.bento-card`
- `R(word.aero)` → `.word--aero`

---

## 2. 전역 상태 매핑

| 사용자 액션 | 상태식 | CSS 선택자 | 변경되는 토큰 / 속성 | 결과 |
|---|---|---|---|---|
| Story 탭 클릭 | `V = story` | `#view-story:checked ~ .app-shell .view--story` | `opacity`, `visibility`, `pointer-events`, `transform` | Story 화면 활성화 |
| Knowledge 탭 클릭 | `V = knowledge` | `#view-knowledge:checked ~ .app-shell .view--knowledge` | 동일 | Knowledge 화면 활성화 |
| Market 탭 클릭 | `V = market` | `#view-market:checked ~ .app-shell .view--market` | 동일 | Market 화면 활성화 |
| F1 테마 선택 | `T = f1` | `#theme-f1:checked ~ .app-shell` | `--color-primary`, `--bg-app` | 카본 기반 테마 |
| NFT 테마 선택 | `T = nft` | `#theme-nft:checked ~ .app-shell` | 동일 | 네온 기반 테마 |
| Blueprint 테마 선택 | `T = blueprint` | `#theme-blueprint:checked ~ .app-shell` | 동일 | 설계도 테마 |

### 기본 view 전환 코드
```css
.view {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(2rem) scale(0.98);
}

#view-story:checked ~ .app-shell .view--story,
#view-knowledge:checked ~ .app-shell .view--knowledge,
#view-market:checked ~ .app-shell .view--market {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: none;
}
```

---

## 3. Scroll Mapping

Story 섹션은 스크롤 진도 `S`에 따라 요소가 변한다.

## 3.1 Hero Title Mapping

### 수학적 정의
`HeroTitle(S)`는 아래를 따른다.

- `translateY(S)`: `0rem → -20vh`
- `scale(S)`: `1 → 1.20`
- `opacity(S)`: `1 → 0`

### 구간 매핑
| 스크롤 구간 | translateY | scale | opacity | 의미 |
|---|---:|---:|---:|---|
| 0% ~ 15% | `0 → -4vh` | `1 → 1.04` | `1` | 첫 인상 유지 |
| 15% ~ 35% | `-4vh → -10vh` | `1.04 → 1.10` | `1` | 타이틀 부상 |
| 35% ~ 70% | `-10vh → -16vh` | `1.10 → 1.16` | `1 → 0.4` | 정보 레이어로 후퇴 |
| 70% ~ 100% | `-16vh → -20vh` | `1.16 → 1.20` | `0.4 → 0` | 무대 퇴장 |

### CSS 정의
```css
@keyframes hero-title-parallax {
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  35%  { transform: translateY(-8vh) scale(1.08); opacity: 1; }
  70%  { transform: translateY(-16vh) scale(1.16); opacity: 0.4; }
  100% { transform: translateY(-20vh) scale(1.2); opacity: 0; }
}

.hero-title {
  animation: hero-title-parallax 1ms linear both;
  animation-timeline: --story;
  animation-range: 0% 35%;
}
```

## 3.2 Exploded Assembly Mapping

### 수학적 정의
`Assembly(S)`:

- `translateZ(S)`: `-8rem → 0rem`
- `rotateX(S)`: `-18deg → 0deg`
- `scale(S)`: `0.84 → 1`
- `opacity(S)`: `0 → 1`

### CSS 정의
```css
@keyframes assembly-reveal {
  0%   {
    transform: translateZ(-8rem) rotateX(-18deg) scale(0.84);
    opacity: 0;
  }
  100% {
    transform: translateZ(0) rotateX(0deg) scale(1);
    opacity: 1;
  }
}

.exploded-assembly {
  animation: assembly-reveal 1ms linear both;
  animation-timeline: --story;
  animation-range: 18% 62%;
}
```

## 3.3 Callout Rail Mapping

각 callout은 서로 다른 attachment range를 가진다.

| 요소 | animation-range | 시작 상태 | 종료 상태 |
|---|---|---|---|
| `.callout--aero` | `22% 34%` | `translateX(2rem)`, `opacity: 0` | `translateX(0)`, `opacity: 1` |
| `.callout--brake` | `36% 48%` | 동일 | 동일 |
| `.callout--floor` | `50% 62%` | 동일 | 동일 |

```css
@keyframes callout-slide-in {
  0%   { transform: translateX(2rem); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

.callout--aero,
.callout--brake,
.callout--floor {
  animation: callout-slide-in 1ms linear both;
  animation-timeline: --story;
}

.callout--aero  { animation-range: 22% 34%; }
.callout--brake { animation-range: 36% 48%; }
.callout--floor { animation-range: 50% 62%; }
```

## 3.4 CTA Mapping

CTA는 마지막 구간에서만 활성화된다.

```css
@keyframes cta-rise {
  0%   { transform: translateY(2rem); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.story-cta {
  animation: cta-rise 1ms linear both;
  animation-timeline: --story;
  animation-range: 78% 100%;
}
```

---

## 4. Hover Mapping

이 섹션의 목표는 “지금 무엇을 보고 있는가?”를 **호버 컨텍스트 전체**로 확산시키는 것이다.

## 4.1 카드 활성화 / 비활성화

### 상태식
- 활성 카드: `H = some(card.zone)`
- 비활성 카드: `¬H(card_i)`

### CSS 선택자
```css
.bento-card:has(.hover-cell:hover) {
  transform: translateY(-0.5rem);
  border-color: var(--color-primary);
}

.knowledge-stage:has(.bento-card:has(.hover-cell:hover)) .bento-card:not(:has(.hover-cell:hover)) {
  filter: blur(5px) brightness(0.5) saturate(0.65);
  transform: scale(0.96);
  opacity: 0.72;
}
```

### 매핑 테이블
| 사용자 액션 | 상태식 | selector | 결과 |
|---|---|---|---|
| 임의 카드 위 hover | `H ≠ ∅` | `.knowledge-stage:has(.bento-card:has(.hover-cell:hover))` | 하나의 카드만 전면화 |
| 비활성 카드 처리 | `¬H(card_i)` | `.bento-card:not(:has(.hover-cell:hover))` | `blur(5px) brightness(0.5)` |
| 활성 카드 처리 | `H(card_i)` | `.bento-card:has(.hover-cell:hover)` | lift + border accent |

## 4.2 광원 위치 매핑

“마우스 위치 기반”을 CSS로 구현할 때, 실제 연속 좌표를 읽지 않고 **카드 내부 4분면**으로 양자화한다.

### 분면 좌표 정의
| 분면 | `--light-x` | `--light-y` |
|---|---:|---:|
| `nw` | `25%` | `25%` |
| `ne` | `75%` | `25%` |
| `sw` | `25%` | `75%` |
| `se` | `75%` | `75%` |

### 카드별 보정
각 카드가 그리드 안에서 차지하는 위치가 다르므로 실제 좌표는 카드별로 보정한다.

```css
.knowledge-stage:has(.card--aero .hover-cell--nw:hover) { --light-x: 26%; --light-y: 26%; }
.knowledge-stage:has(.card--aero .hover-cell--ne:hover) { --light-x: 42%; --light-y: 24%; }
.knowledge-stage:has(.card--aero .hover-cell--sw:hover) { --light-x: 28%; --light-y: 44%; }
.knowledge-stage:has(.card--aero .hover-cell--se:hover) { --light-x: 44%; --light-y: 46%; }

.knowledge-stage:has(.card--tire .hover-cell--nw:hover) { --light-x: 56%; --light-y: 24%; }
.knowledge-stage:has(.card--tire .hover-cell--ne:hover) { --light-x: 78%; --light-y: 24%; }
.knowledge-stage:has(.card--tire .hover-cell--sw:hover) { --light-x: 58%; --light-y: 44%; }
.knowledge-stage:has(.card--tire .hover-cell--se:hover) { --light-x: 80%; --light-y: 46%; }

.knowledge-stage:has(.card--brake .hover-cell--nw:hover) { --light-x: 24%; --light-y: 58%; }
.knowledge-stage:has(.card--brake .hover-cell--ne:hover) { --light-x: 42%; --light-y: 58%; }
.knowledge-stage:has(.card--brake .hover-cell--sw:hover) { --light-x: 26%; --light-y: 78%; }
.knowledge-stage:has(.card--brake .hover-cell--se:hover) { --light-x: 44%; --light-y: 78%; }

.knowledge-stage:has(.card--telemetry .hover-cell--nw:hover) { --light-x: 58%; --light-y: 58%; }
.knowledge-stage:has(.card--telemetry .hover-cell--ne:hover) { --light-x: 78%; --light-y: 58%; }
.knowledge-stage:has(.card--telemetry .hover-cell--sw:hover) { --light-x: 60%; --light-y: 78%; }
.knowledge-stage:has(.card--telemetry .hover-cell--se:hover) { --light-x: 80%; --light-y: 78%; }
```

### 광원 렌더 함수
`--light-x`, `--light-y`, `--light-alpha`는 `@property`로 등록하여 보간한다.

```css
.knowledge-stage::before {
  content: "";
  position: absolute;
  inset: -10%;
  pointer-events: none;
  background:
    radial-gradient(
      circle 34rem at var(--light-x) var(--light-y),
      color-mix(in srgb, var(--color-primary) 30%, transparent),
      transparent 70%
    );
  opacity: 0.2;
  filter: blur(28px);
}
```

## 4.3 배경 텍스트 전환 로직

문자열 교체가 아니라 **여러 단어 레이어를 쌓아 두고 opacity로 전환**한다.

```css
.word {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: translateY(1rem);
  transition:
    opacity 220ms ease,
    transform 320ms var(--ease-out-expo);
}

.word--default {
  opacity: 0.16;
  transform: none;
}
```

### 매핑 테이블
| Hover 상태 | selector | 보이는 단어 | 숨겨지는 단어 |
|---|---|---|---|
| `H = aero.*` | `.knowledge-stage:has(.card--aero .hover-cell:hover)` | `.word--aero` | 나머지 `.word` |
| `H = tire.*` | `.knowledge-stage:has(.card--tire .hover-cell:hover)` | `.word--tire` | 나머지 `.word` |
| `H = brake.*` | `.knowledge-stage:has(.card--brake .hover-cell:hover)` | `.word--brake` | 나머지 `.word` |
| `H = telemetry.*` | `.knowledge-stage:has(.card--telemetry .hover-cell:hover)` | `.word--telemetry` | 나머지 `.word` |

### CSS 정의
```css
.knowledge-stage:has(.card--aero .hover-cell:hover) .word--aero,
.knowledge-stage:has(.card--tire .hover-cell:hover) .word--tire,
.knowledge-stage:has(.card--brake .hover-cell:hover) .word--brake,
.knowledge-stage:has(.card--telemetry .hover-cell:hover) .word--telemetry {
  opacity: 1;
  transform: translateY(0);
}

.knowledge-stage:has(.bento-card .hover-cell:hover) .word--default {
  opacity: 0;
}
```

---

## 5. Click(Check) Mapping

persistent state는 `:checked`로 관리된다.

## 5.1 Paint Mapping

### 상태식
- `P ∈ {red, silver, obsidian}`

### selector
```css
#color-red:checked ~ .app-shell { ... }
#color-silver:checked ~ .app-shell { ... }
#color-obsidian:checked ~ .app-shell { ... }
```

### 매핑 테이블
| 상태 | 선택자 | 변경되는 토큰 | 결과 |
|---|---|---|---|
| `P = red` | `#color-red:checked ~ .app-shell` | `--paint-base`, `--paint-specular`, `--rim-glow` | 레드 바디 + 따뜻한 하이라이트 |
| `P = silver` | `#color-silver:checked ~ .app-shell` | 동일 | 메탈릭 티타늄 바디 |
| `P = obsidian` | `#color-obsidian:checked ~ .app-shell` | 동일 | 다크 글로시 바디 |

### CSS 정의
```css
#color-red:checked ~ .app-shell {
  --paint-base: hsl(3 92% 56%);
  --paint-specular: hsl(14 100% 84%);
  --paint-shadow: hsl(356 72% 32%);
  --rim-glow: hsl(3 92% 56% / 0.34);
}

#color-silver:checked ~ .app-shell {
  --paint-base: hsl(220 10% 70%);
  --paint-specular: hsl(220 18% 92%);
  --paint-shadow: hsl(220 10% 38%);
  --rim-glow: hsl(220 12% 85% / 0.2);
}

#color-obsidian:checked ~ .app-shell {
  --paint-base: hsl(230 8% 16%);
  --paint-specular: hsl(220 10% 36%);
  --paint-shadow: hsl(220 18% 6%);
  --rim-glow: hsl(282 92% 66% / 0.18);
}
```

## 5.2 Camera Mapping

### 상태식
- `C ∈ {iso, side, top}`

### 매핑 테이블
| 상태 | 선택자 | `rotateX` | `rotateY` | `scale` | 결과 |
|---|---|---:|---:|---:|---|
| `C = iso` | `#camera-isometric:checked ~ .app-shell .product-3d-model` | `-18deg` | `-28deg` | `1` | 기본 쇼룸 시점 |
| `C = side` | `#camera-side:checked ~ .app-shell .product-3d-model` | `0deg` | `-90deg` | `1.02` | 측면 실루엣 강조 |
| `C = top` | `#camera-top:checked ~ .app-shell .product-3d-model` | `-82deg` | `0deg` | `1.06` | aero 패키지 강조 |

### CSS 정의
```css
#camera-isometric:checked ~ .app-shell .product-3d-model {
  --model-rot-x: -18deg;
  --model-rot-y: -28deg;
  --model-scale: 1;
}

#camera-side:checked ~ .app-shell .product-3d-model {
  --model-rot-x: 0deg;
  --model-rot-y: -90deg;
  --model-scale: 1.02;
}

#camera-top:checked ~ .app-shell .product-3d-model {
  --model-rot-x: -82deg;
  --model-rot-y: 0deg;
  --model-scale: 1.06;
}
```

## 5.3 Exploded Mapping

### 상태식
- `X ∈ {off, on}`

### 매핑 원리
`X = on`이면 부품별 `translate3d()`가 확장된다.

| 파츠 | `X = off` | `X = on` |
|---|---|---|
| Front wing | `translateZ(2.4rem) translateY(-5.6rem)` | `translateZ(6rem) translateY(-8rem)` |
| Rear wing | `translateZ(-1.8rem) translateY(5.2rem)` | `translateZ(-5rem) translateY(8rem)` |
| Front-left wheel | 몸체 근처 | `translate3d(-4.5rem, -1rem, 5.8rem)` |
| Front-right wheel | 몸체 근처 | `translate3d(4.5rem, -1rem, 5.8rem)` |

### CSS 정의
```css
#explode-off:checked ~ .app-shell .model-wing--front {
  transform: translateZ(2.4rem) translateY(-5.6rem);
}

#explode-on:checked ~ .app-shell .model-wing--front {
  transform: translateZ(6rem) translateY(-8rem);
}

#explode-on:checked ~ .app-shell .model-wing--rear {
  transform: translateZ(-5rem) translateY(8rem);
}

#explode-on:checked ~ .app-shell .wheel--fl {
  transform: translate3d(-4.5rem, -1rem, 5.8rem) rotateY(-26deg);
}

#explode-on:checked ~ .app-shell .wheel--fr {
  transform: translate3d(4.5rem, -1rem, 5.8rem) rotateY(26deg);
}
```

## 5.4 Edition Mapping

### 상태식
- `E ∈ {core, rare, founder}`

### 매핑 테이블
| 상태 | selector | NFT 플라크 | CTA |
|---|---|---|---|
| `E = core` | `#edition-core:checked ~ .app-shell` | 기본 포일 | `.checkout-link--core` 표시 |
| `E = rare` | `#edition-rare:checked ~ .app-shell` | 채도/광량 상승 | `.checkout-link--rare` 표시 |
| `E = founder` | `#edition-founder:checked ~ .app-shell` | 최고 광량/하이라이트 | `.checkout-link--founder` 표시 |

### CSS 정의
```css
.checkout-link {
  display: none;
}

#edition-core:checked ~ .app-shell .checkout-link--core,
#edition-rare:checked ~ .app-shell .checkout-link--rare,
#edition-founder:checked ~ .app-shell .checkout-link--founder {
  display: inline-flex;
}
```

```css
#edition-core:checked ~ .app-shell .nft-plaque {
  filter: saturate(1) brightness(1);
}

#edition-rare:checked ~ .app-shell .nft-plaque {
  filter: saturate(1.18) brightness(1.04);
}

#edition-founder:checked ~ .app-shell .nft-plaque {
  filter: saturate(1.28) brightness(1.08);
  box-shadow:
    0 0 0 1px hsl(0 0% 100% / 0.06) inset,
    0 0 4rem color-mix(in srgb, var(--color-accent) 32%, transparent);
}
```

---

## 6. 합성 규칙(Compositional Rules)

실제 화면은 단일 상태가 아니라 여러 상태의 합성 결과다.

## 6.1 예시 A — “Blueprint + Top Camera + Founder”
### 상태식
```text
T = blueprint
∧ C = top
∧ E = founder
```

### selector 집합
```css
#theme-blueprint:checked ~ .app-shell { ... }
#camera-top:checked ~ .app-shell .product-3d-model { ... }
#edition-founder:checked ~ .app-shell .nft-plaque { ... }
```

### 결과
- 전체 배경이 cyan drafting grid를 가진다.
- 모델은 탑뷰로 기울어진다.
- NFT 플라크의 foil/광량이 최대가 된다.

## 6.2 예시 B — “Market view + Obsidian + Exploded”
### 상태식
```text
V = market ∧ P = obsidian ∧ X = on
```

### 결과
- Market view만 활성
- 모델은 어두운 바디
- 각 파츠가 분해된 상태로 펼쳐짐

---

## 7. 우선순위 규칙

CSS는 여러 상태가 동시에 겹칠 수 있으므로 우선순위를 정의해야 한다.

### 우선순위
1. **View 활성화**
2. **Theme 토큰**
3. **Persistent state 토큰**
4. **Hover context**
5. **Scroll progress**

### 이유
- 비활성 view의 hover나 scroll이 활성 view를 덮어쓰면 안 된다.
- theme는 베이스 팔레트라서 paint보다 먼저 깔려야 한다.
- hover는 일시적 시각 강조이므로 persistent state 위에 얹힌다.

---

## 8. 성능 친화적 매핑 원칙

모든 매핑은 가능한 한 **token mutation → render consumption** 구조를 따른다.

### 좋은 매핑
```css
#camera-top:checked ~ .app-shell .product-3d-model {
  --model-rot-x: -82deg;
  --model-rot-y: 0deg;
}
```

```css
.product-3d-model {
  transform:
    rotateX(var(--model-rot-x))
    rotateY(var(--model-rot-y))
    scale(var(--model-scale));
}
```

### 나쁜 매핑
```css
#camera-top:checked ~ .app-shell .model-body   { transform: ...; }
#camera-top:checked ~ .app-shell .model-wing   { transform: ...; }
#camera-top:checked ~ .app-shell .wheel        { transform: ...; }
#camera-top:checked ~ .app-shell .nft-plaque   { transform: ...; }
```

토큰 기반 매핑은 selector 수를 줄이고, transition 일관성을 확보한다.

---

## 9. 디버그용 체크리스트

특정 인터랙션이 동작하지 않을 때 아래 순서로 본다.

1. input이 `.app-shell`보다 앞에 있는가
2. `name` 그룹이 맞는가
3. `label for`와 `input id`가 정확히 일치하는가
4. `animation` shorthand 뒤에 `animation-timeline`을 썼는가
5. `scroll-timeline`을 가진 요소가 실제로 overflow scroll 상태인가
6. `:has()` 범위가 너무 넓어 성능 저하나 selector 충돌을 일으키지 않는가
7. 토큰이 정의되었는데 소비되지 않는 것은 아닌가

---

## 10. 최종 공식

Velocity Vault의 인터랙션은 아래 공식으로 귀결된다.

```text
Render =
  View(V)
+ Theme(T)
+ Product(P, C, X, E)
+ Knowledge(H)
+ Story(S)
```

이를 CSS selector로 풀면 다음과 같다.

```text
#state:checked ~ .app-shell ...
.container:has(.hover-cell:hover) ...
animation-timeline: --story;
```

즉, 이 프로젝트의 인터랙션은 이벤트 리스너가 아니라  
**선택자, 키프레임, 토큰의 합성 방정식**이다.
