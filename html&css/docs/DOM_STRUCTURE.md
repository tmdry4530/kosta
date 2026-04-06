# 평탄화된 DOM 아키텍처

이 문서는 **Velocity Vault의 가장 중요한 기술 계약서**다.  
순수 CSS로 전역 상태를 제어하려면, **상태를 저장하는 input이 렌더링되는 UI보다 먼저 등장**해야 하며, 그 input과 UI가 같은 부모 아래 형제로 놓여야 한다.

---

## 1. 왜 DOM을 평평하게(flatten) 해야 하는가

CSS의 상태 제어는 “현재 요소에서 앞으로 내려가거나”, “뒤따르는 형제에게 전파되는” 패턴이 가장 안정적이다.  
따라서 다음 구조를 고수한다.

```html
<body>
  <!-- 1) global state registry -->
  <input id="view-story" ...>
  <input id="view-knowledge" ...>
  <input id="view-market" ...>

  <input id="theme-f1" ...>
  <input id="theme-nft" ...>
  <input id="theme-blueprint" ...>

  <input id="color-red" ...>
  <input id="color-silver" ...>
  <input id="color-obsidian" ...>

  <!-- 2) render tree -->
  <div class="app-shell">
    ...
  </div>
</body>
```

이렇게 해야 다음이 가능하다.

```css
#view-market:checked ~ .app-shell .view--market { ... }
#theme-blueprint:checked ~ .app-shell { ... }
#color-red:checked ~ .app-shell .product-3d-model { ... }
```

반대로 input이 UI 내부 깊숙한 곳에 들어가면, nav/hero/background/CTA 같은 **먼 곳의 형제 요소**를 건드릴 수 없다.

---

## 2. 구조 규칙

## 2.1 강제 규칙
1. 모든 **persistent state input**은 `<body>` 직하위 최상단 형제 요소로 둔다.
2. 실제 화면을 그리는 `.app-shell`은 모든 state input 뒤에 온다.
3. 화면 전환용 section은 `.view-sections` 내부에서 서로 겹쳐 놓고, 선택된 것만 활성화한다.
4. 전역 label UI는 `.app-shell` 안에 두되, 반드시 앞쪽 input을 `for` 속성으로 참조한다.
5. hover처럼 휘발성 상태는 section 내부에서 `:has()`로 처리한다.
6. 진짜 상태 저장이 필요한 경우 hover/focus가 아니라 **항상 input**을 쓴다.

## 2.2 허용 규칙
- section 내부 local hover zone
- 카드 내부 hover cell
- pseudo-element를 이용한 배경 광원/질감/라벨
- section 내부의 purely decorative wrapper

## 2.3 금지 규칙
- `.app-shell`보다 뒤에 전역 상태 input을 두는 것
- 전역 상태 input을 여러 wrapper 안에 묻어두는 것
- `display: none`으로 input을 제거하는 것
- button 클릭을 상태 변화의 주 수단으로 기대하는 것
- 상위 조상 선택을 위해 DOM을 과도하게 중첩하는 것

---

## 3. 전역 상태 레지스트리

아래 state registry를 기본 세트로 사용한다.

| 그룹 | type | name | id | 기본값 | 목적 |
|---|---|---|---|---|---|
| View | radio | `view` | `view-story` | checked | 스토리 화면 |
| View | radio | `view` | `view-knowledge` |  | 지식 화면 |
| View | radio | `view` | `view-market` |  | 판매 화면 |
| Theme | radio | `theme` | `theme-f1` | checked | F1 카본 테마 |
| Theme | radio | `theme` | `theme-nft` |  | NFT 네온 테마 |
| Theme | radio | `theme` | `theme-blueprint` |  | 설계도 테마 |
| Paint | radio | `paint` | `color-red` | checked | Rosso 계열 |
| Paint | radio | `paint` | `color-silver` |  | Titanium 계열 |
| Paint | radio | `paint` | `color-obsidian` |  | Obsidian 계열 |
| Trim | radio | `trim` | `trim-carbon` | checked | 카본 질감 |
| Trim | radio | `trim` | `trim-brushed` |  | 브러시드 메탈 |
| Camera | radio | `camera` | `camera-isometric` | checked | 기본 사선 |
| Camera | radio | `camera` | `camera-side` |  | 측면 |
| Camera | radio | `camera` | `camera-top` |  | 탑뷰 |
| Explode | radio | `explode` | `explode-off` | checked | 조립 상태 |
| Explode | radio | `explode` | `explode-on` |  | exploded 상태 |
| Edition | radio | `edition` | `edition-core` | checked | 일반 NFT |
| Edition | radio | `edition` | `edition-rare` |  | 희소판 |
| Edition | radio | `edition` | `edition-founder` |  | 창립자판 |

---

## 4. 권장 HTML Skeleton

아래 뼈대는 그대로 복제해서 시작해도 된다.

```html
<body class="vault-body">
  <!-- ========================================================= -->
  <!-- 1) GLOBAL STATE REGISTRY                                  -->
  <!-- 반드시 body 바로 아래, app-shell보다 먼저 선언할 것            -->
  <!-- ========================================================= -->

  <input class="state-input" type="radio" name="view" id="view-story" checked>
  <input class="state-input" type="radio" name="view" id="view-knowledge">
  <input class="state-input" type="radio" name="view" id="view-market">

  <input class="state-input" type="radio" name="theme" id="theme-f1" checked>
  <input class="state-input" type="radio" name="theme" id="theme-nft">
  <input class="state-input" type="radio" name="theme" id="theme-blueprint">

  <input class="state-input" type="radio" name="paint" id="color-red" checked>
  <input class="state-input" type="radio" name="paint" id="color-silver">
  <input class="state-input" type="radio" name="paint" id="color-obsidian">

  <input class="state-input" type="radio" name="trim" id="trim-carbon" checked>
  <input class="state-input" type="radio" name="trim" id="trim-brushed">

  <input class="state-input" type="radio" name="camera" id="camera-isometric" checked>
  <input class="state-input" type="radio" name="camera" id="camera-side">
  <input class="state-input" type="radio" name="camera" id="camera-top">

  <input class="state-input" type="radio" name="explode" id="explode-off" checked>
  <input class="state-input" type="radio" name="explode" id="explode-on">

  <input class="state-input" type="radio" name="edition" id="edition-core" checked>
  <input class="state-input" type="radio" name="edition" id="edition-rare">
  <input class="state-input" type="radio" name="edition" id="edition-founder">

  <!-- ========================================================= -->
  <!-- 2) RENDER TREE                                            -->
  <!-- ========================================================= -->

  <div class="app-shell">
    <header class="global-header">
      <a class="brandmark" href="#top">The Velocity Vault</a>

      <nav class="global-nav" aria-label="Primary">
        <label class="nav-chip" for="view-story">Story</label>
        <label class="nav-chip" for="view-knowledge">Knowledge</label>
        <label class="nav-chip" for="view-market">Market</label>
      </nav>

      <div class="theme-switcher" aria-label="Theme">
        <label class="theme-pill" for="theme-f1">F1</label>
        <label class="theme-pill" for="theme-nft">NFT</label>
        <label class="theme-pill" for="theme-blueprint">Blueprint</label>
      </div>
    </header>

    <main class="view-sections">
      <!-- ==================== STORY VIEW ==================== -->
      <section class="view view--story" id="story">
        <div class="story-scroll-host">
          <div class="story-track">
            <div class="story-stage">
              <header class="story-hero">
                <p class="eyebrow">Formula One / Components / Collectibles</p>
                <h1 class="hero-title">Engineering becomes collectible.</h1>
                <p class="hero-copy">
                  Aero surfaces, thermal systems, telemetry language and NFT provenance
                  in one CSS-native showroom.
                </p>
              </header>

              <div class="exploded-assembly">
                <div class="model-body"></div>
                <div class="model-wing model-wing--front"></div>
                <div class="model-wing model-wing--rear"></div>
                <div class="wheel wheel--fl"></div>
                <div class="wheel wheel--fr"></div>
                <div class="wheel wheel--rl"></div>
                <div class="wheel wheel--rr"></div>
              </div>

              <aside class="callout-rail">
                <article class="callout callout--aero">Front wing load path</article>
                <article class="callout callout--brake">Brake cooling envelope</article>
                <article class="callout callout--floor">Floor edge vortex</article>
              </aside>

              <footer class="story-cta">
                <label class="cta cta--primary" for="view-market">Configure the collectible</label>
              </footer>
            </div>
          </div>
        </div>
      </section>

      <!-- ================== KNOWLEDGE VIEW ================== -->
      <section class="view view--knowledge" id="knowledge">
        <div class="knowledge-stage">
          <div class="knowledge-lexicon" aria-hidden="true">
            <span class="word word--default">VELOCITY</span>
            <span class="word word--aero">DOWNFORCE</span>
            <span class="word word--tire">CONTACT PATCH</span>
            <span class="word word--brake">THERMAL WINDOW</span>
            <span class="word word--telemetry">SIGNAL TRACE</span>
          </div>

          <div class="bento-grid">
            <article class="bento-card card--aero">
              <span class="hover-cell hover-cell--nw" aria-hidden="true"></span>
              <span class="hover-cell hover-cell--ne" aria-hidden="true"></span>
              <span class="hover-cell hover-cell--sw" aria-hidden="true"></span>
              <span class="hover-cell hover-cell--se" aria-hidden="true"></span>

              <div class="card-content">
                <p class="card-kicker">Aero</p>
                <h2>Front wing pressure map</h2>
                <p>How stagnation pressure, camber and endplate behavior define front axle bite.</p>
              </div>
            </article>

            <article class="bento-card card--tire">
              <span class="hover-cell hover-cell--nw" aria-hidden="true"></span>
              <span class="hover-cell hover-cell--ne" aria-hidden="true"></span>
              <span class="hover-cell hover-cell--sw" aria-hidden="true"></span>
              <span class="hover-cell hover-cell--se" aria-hidden="true"></span>

              <div class="card-content">
                <p class="card-kicker">Tire</p>
                <h2>Load transfer and the contact patch</h2>
                <p>Why vertical load rise does not linearly translate into grip rise.</p>
              </div>
            </article>

            <article class="bento-card card--brake">
              <span class="hover-cell hover-cell--nw" aria-hidden="true"></span>
              <span class="hover-cell hover-cell--ne" aria-hidden="true"></span>
              <span class="hover-cell hover-cell--sw" aria-hidden="true"></span>
              <span class="hover-cell hover-cell--se" aria-hidden="true"></span>

              <div class="card-content">
                <p class="card-kicker">Brake</p>
                <h2>Disc temperature envelope</h2>
                <p>Managing the thermal window without overcooling entry stability away.</p>
              </div>
            </article>

            <article class="bento-card card--telemetry">
              <span class="hover-cell hover-cell--nw" aria-hidden="true"></span>
              <span class="hover-cell hover-cell--ne" aria-hidden="true"></span>
              <span class="hover-cell hover-cell--sw" aria-hidden="true"></span>
              <span class="hover-cell hover-cell--se" aria-hidden="true"></span>

              <div class="card-content">
                <p class="card-kicker">Telemetry</p>
                <h2>Signal trace as narrative</h2>
                <p>Throttle, brake and steering traces turned into readable showroom language.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- ==================== MARKET VIEW ==================== -->
      <section class="view view--market" id="market">
        <div class="market-stage">
          <div class="product-scene">
            <div class="product-3d-model">
              <div class="model-body"></div>
              <div class="model-canopy"></div>
              <div class="model-wing model-wing--front"></div>
              <div class="model-wing model-wing--rear"></div>
              <div class="wheel wheel--fl"></div>
              <div class="wheel wheel--fr"></div>
              <div class="wheel wheel--rl"></div>
              <div class="wheel wheel--rr"></div>
              <div class="nft-plaque"></div>
            </div>
          </div>

          <aside class="control-panel">
            <section class="control-group">
              <h2>Paint</h2>
              <div class="chip-row">
                <label class="swatch swatch--red" for="color-red">Rosso</label>
                <label class="swatch swatch--silver" for="color-silver">Titanium</label>
                <label class="swatch swatch--obsidian" for="color-obsidian">Obsidian</label>
              </div>
            </section>

            <section class="control-group">
              <h2>Trim</h2>
              <div class="chip-row">
                <label class="chip" for="trim-carbon">Carbon</label>
                <label class="chip" for="trim-brushed">Brushed</label>
              </div>
            </section>

            <section class="control-group">
              <h2>Camera</h2>
              <div class="chip-row">
                <label class="chip" for="camera-isometric">Iso</label>
                <label class="chip" for="camera-side">Side</label>
                <label class="chip" for="camera-top">Top</label>
              </div>
            </section>

            <section class="control-group">
              <h2>Assembly</h2>
              <div class="chip-row">
                <label class="chip" for="explode-off">Assembled</label>
                <label class="chip" for="explode-on">Exploded</label>
              </div>
            </section>

            <section class="control-group">
              <h2>Edition</h2>
              <div class="chip-row">
                <label class="chip" for="edition-core">Core</label>
                <label class="chip" for="edition-rare">Rare</label>
                <label class="chip" for="edition-founder">Founder</label>
              </div>
            </section>

            <div class="purchase-stack">
              <a class="checkout-link checkout-link--core" href="/mint/core">Mint Core Edition</a>
              <a class="checkout-link checkout-link--rare" href="/mint/rare">Mint Rare Edition</a>
              <a class="checkout-link checkout-link--founder" href="/mint/founder">Mint Founder Edition</a>
            </div>
          </aside>
        </div>
      </section>
    </main>
  </div>
</body>
```

---

## 5. 상태 입력을 숨기는 방식

`display: none`은 피한다. label 연결성, 포커스, 접근성 추적을 유지하기 위해 다음 패턴을 사용한다.

```css
.state-input {
  position: fixed;
  inline-size: 1px;
  block-size: 1px;
  margin: 0;
  padding: 0;
  border: 0;
  opacity: 0;
  pointer-events: none;
  inset: 0 auto auto 0;
}
```

필요하면 스크린리더용 보조 텍스트를 별도 `.sr-only` 클래스로 제공한다.

---

## 6. 화면 전환 구조

3개 화면은 페이지를 갈아끼우는 방식이 아니라, **동일 DOM 위치에 겹쳐 둔 후 상태로 활성화**한다.

```css
.view-sections {
  display: grid;
}

.view {
  grid-area: 1 / 1;
  min-block-size: 100dvh;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transform: translateY(2rem) scale(0.98);
  transition:
    opacity 240ms ease,
    transform 480ms cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0s linear 240ms;
}

#view-story:checked ~ .app-shell .view--story,
#view-knowledge:checked ~ .app-shell .view--knowledge,
#view-market:checked ~ .app-shell .view--market {
  opacity: 1;
  pointer-events: auto;
  visibility: visible;
  transform: none;
  transition-delay: 0s;
}
```

### 이유
- `display: none`은 transition이 없다.
- absolute 겹침보다 grid 겹침이 문서 구조를 읽기 쉽다.
- 비활성 view도 DOM에 남아 있으므로 theme/state selector가 전체에 적용된다.


### Story 전용 scroller 생성 규칙
named scroll timeline이 살아 있으려면 실제 스크롤 가능한 높이가 필요하다.

```css
.story-scroll-host {
  block-size: 100dvh;
  overflow-y: auto;
  scroll-timeline: --story block;
}

.story-track {
  min-block-size: 420vh;
}
```

`scroll-timeline`은 overflow가 없으면 생성되지 않는다.

---

## 7. 테마 적용 구조

theme는 `.app-shell` 전체 토큰을 바꾸는 상위 상태다.

```css
#theme-f1:checked ~ .app-shell {
  --color-primary: hsl(3 92% 56%);
  --color-accent: hsl(50 100% 69%);
  --bg-app: hsl(220 10% 8%);
  --grid-line: hsl(0 0% 100% / 0.06);
}

#theme-nft:checked ~ .app-shell {
  --color-primary: hsl(282 92% 66%);
  --color-accent: hsl(191 96% 63%);
  --bg-app: hsl(246 27% 10%);
  --grid-line: hsl(191 96% 63% / 0.1);
}

#theme-blueprint:checked ~ .app-shell {
  --color-primary: hsl(208 100% 68%);
  --color-accent: hsl(185 90% 72%);
  --bg-app: hsl(217 54% 14%);
  --grid-line: hsl(185 90% 72% / 0.12);
}
```

---

## 8. Knowledge view의 hover DOM 설계

이 섹션은 단순한 `.bento-card:hover`만으로는 부족하다.  
카드 위에 투명 hover cell을 깔아 **“카드 자체 활성화”와 “카드 내부 위치”를 동시에 얻는다.**

```html
<article class="bento-card card--aero">
  <span class="hover-cell hover-cell--nw"></span>
  <span class="hover-cell hover-cell--ne"></span>
  <span class="hover-cell hover-cell--sw"></span>
  <span class="hover-cell hover-cell--se"></span>

  <div class="card-content">...</div>
</article>
```

```css
.bento-card {
  position: relative;
  overflow: hidden;
}

.hover-cell {
  position: absolute;
  z-index: 3;
}

.hover-cell--nw { inset: 0 50% 50% 0; }
.hover-cell--ne { inset: 0 0 50% 50%; }
.hover-cell--sw { inset: 50% 50% 0 0; }
.hover-cell--se { inset: 50% 0 0 50%; }

.bento-card:has(.hover-cell:hover) {
  transform: translateY(-0.5rem);
  border-color: var(--color-primary);
}
```

이 구조 덕분에 `.knowledge-stage`는 다음처럼 상위 문맥을 읽을 수 있다.

```css
.knowledge-stage:has(.card--aero .hover-cell--ne:hover) {
  --light-x: 72%;
  --light-y: 24%;
}

.knowledge-stage:has(.card--telemetry .hover-cell--sw:hover) {
  --light-x: 26%;
  --light-y: 78%;
}
```

---

## 9. Market view의 3D 모델 DOM 설계

3D 모델은 한 개의 canvas가 아니라, 서로 다른 깊이를 가진 DOM 면들의 조립이다.

```html
<div class="product-3d-model">
  <div class="model-body"></div>
  <div class="model-canopy"></div>
  <div class="model-wing model-wing--front"></div>
  <div class="model-wing model-wing--rear"></div>
  <div class="wheel wheel--fl"></div>
  <div class="wheel wheel--fr"></div>
  <div class="wheel wheel--rl"></div>
  <div class="wheel wheel--rr"></div>
  <div class="nft-plaque"></div>
</div>
```

```css
.product-scene {
  perspective: var(--perspective-product);
  perspective-origin: 50% 42%;
}

.product-3d-model {
  position: relative;
  inline-size: min(40rem, 90vw);
  aspect-ratio: 1 / 1;
  transform-style: preserve-3d;
  transform:
    rotateX(var(--model-rot-x))
    rotateY(var(--model-rot-y))
    scale(var(--model-scale));
}

.product-3d-model > * {
  position: absolute;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}
```

---

## 10. 상태-선택자 연결 규칙

상태 selector는 **반드시 `#state-id:checked ~ .app-shell`로 시작**한다.  
이 접두사는 Velocity Vault의 전역 문법이다.

### 예시
```css
#color-silver:checked ~ .app-shell .product-3d-model { ... }
#edition-founder:checked ~ .app-shell .nft-plaque { ... }
#view-knowledge:checked ~ .app-shell .global-header { ... }
```

### 장점
- 모든 상태를 grep으로 찾기 쉽다.
- CSS cascade 디버깅이 단순하다.
- “어떤 input이 무엇을 바꾸는지”가 선택자만 봐도 드러난다.

---

## 11. 피해야 할 잘못된 구조

## 11.1 input이 view 내부에 들어간 경우
```html
<section class="view view--market">
  <input id="color-red" type="radio" name="paint">
  ...
</section>
```

이 경우 `#color-red:checked ~ .app-shell .global-header` 같은 규칙은 불가능하다.  
input이 헤더보다 뒤쪽 깊은 곳에 있기 때문이다.

## 11.2 input을 wrapper 안에 넣은 경우
```html
<div class="state-registry">
  <input id="view-story" type="radio" name="view">
</div>

<div class="app-shell">...</div>
```

이 구조는 다음과 같은 단순 selector를 막는다.

```css
#view-story:checked ~ .app-shell { ... } /* 동작하지 않음 */
```

wrapper를 쓰려면 `body:has(#view-story:checked) .app-shell` 같은 우회가 필요해진다.  
이 프로젝트는 selector 비용을 줄이기 위해 wrapper 없는 registry를 기본으로 한다.

---

## 12. 최종 아키텍처 원칙

1. **상태는 위로 올린다.**  
   가장 먼저 선언되고, 가장 넓게 영향을 준다.

2. **렌더 트리는 뒤로 보낸다.**  
   input 뒤에서 selector에 반응한다.

3. **글로벌 상태와 로컬 hover를 분리한다.**  
   persistent = input, transient = `:has()`.

4. **3D는 DOM 레이어 조립으로 본다.**  
   mesh가 아니라 면의 관계다.

5. **모든 상호작용은 선택자로 역추적 가능해야 한다.**  
   “어떤 상태가 어떤 UI를 바꾸는가”가 selector로 설명되지 않으면 설계 실패다.
