# CSS 변수 및 3D 물리 환경

Velocity Vault의 디자인 시스템은 단순히 색상표가 아니다.  
이 문서는 **토큰 시스템 + 깊이 규칙 + 표면 질감 규칙**을 함께 정의한다.

---

## 1. 토큰 구조

토큰은 4계층으로 나눈다.

1. **Foundation token**
   - 색상 원본, 공간, 반경, 그림자, easing
2. **Semantic token**
   - `--color-primary`, `--bg-app`, `--surface-panel`
3. **State token**
   - `--paint-base`, `--model-rot-x`, `--light-x`
4. **Component token**
   - `.bento-card`, `.product-3d-model`, `.glass-panel` 내부에서만 소비되는 세부 토큰

---


## 2.1 등록형 custom property
광원 좌표처럼 gradient 내부에서 직접 소비되는 값은 `@property`로 등록해 부드럽게 보간한다.

```css
@property --light-x {
  syntax: "<percentage>";
  inherits: true;
  initial-value: 50%;
}

@property --light-y {
  syntax: "<percentage>";
  inherits: true;
  initial-value: 50%;
}

@property --light-alpha {
  syntax: "<number>";
  inherits: true;
  initial-value: 0.2;
}
```

이 등록 덕분에 `:has()`로 바뀌는 조명 좌표가 점프하지 않고 보간된다.

---

## 2. `:root` 글로벌 토큰

아래 토큰 세트로 시작한다.

```css
:root {
  color-scheme: dark;

  /* --------------------------------------------------------- */
  /* Typography                                                 */
  /* --------------------------------------------------------- */
  --font-display: "Inter Tight", "SUIT Variable", system-ui, sans-serif;
  --font-body: "Inter", "Pretendard Variable", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "IBM Plex Mono", monospace;

  --text-xs: clamp(0.75rem, 0.72rem + 0.2vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.84rem + 0.25vw, 1rem);
  --text-md: clamp(1rem, 0.94rem + 0.35vw, 1.125rem);
  --text-lg: clamp(1.25rem, 1.05rem + 1vw, 1.75rem);
  --text-xl: clamp(2rem, 1.3rem + 3vw, 4rem);
  --text-hero: clamp(3rem, 1.7rem + 5vw, 7rem);

  /* --------------------------------------------------------- */
  /* Space                                                      */
  /* --------------------------------------------------------- */
  --space-2xs: clamp(0.25rem, 0.2rem + 0.2vw, 0.5rem);
  --space-xs: clamp(0.5rem, 0.42rem + 0.4vw, 0.75rem);
  --space-sm: clamp(0.75rem, 0.6rem + 0.5vw, 1rem);
  --space-md: clamp(1rem, 0.8rem + 0.8vw, 1.5rem);
  --space-lg: clamp(1.5rem, 1.1rem + 1.4vw, 2.5rem);
  --space-xl: clamp(2.5rem, 1.7rem + 2.8vw, 4rem);
  --space-2xl: clamp(4rem, 2.4rem + 5vw, 7rem);

  /* --------------------------------------------------------- */
  /* Radius                                                     */
  /* --------------------------------------------------------- */
  --radius-sm: 0.75rem;
  --radius-md: 1.25rem;
  --radius-lg: 1.75rem;
  --radius-xl: 2.5rem;
  --radius-pill: 999rem;

  /* --------------------------------------------------------- */
  /* Core Neutrals                                              */
  /* --------------------------------------------------------- */
  --black-900: hsl(220 18% 6%);
  --black-800: hsl(222 16% 8%);
  --black-700: hsl(220 14% 11%);
  --black-600: hsl(218 10% 16%);
  --white-100: hsl(0 0% 100%);
  --white-90: hsl(0 0% 100% / 0.9);
  --white-75: hsl(0 0% 100% / 0.75);
  --white-60: hsl(0 0% 100% / 0.6);
  --white-20: hsl(0 0% 100% / 0.2);
  --white-10: hsl(0 0% 100% / 0.1);
  --white-06: hsl(0 0% 100% / 0.06);

  /* --------------------------------------------------------- */
  /* Brand Palettes                                             */
  /* --------------------------------------------------------- */
  --f1-red: hsl(3 92% 56%);
  --f1-gold: hsl(49 100% 68%);
  --f1-orange: hsl(20 100% 63%);

  --nft-violet: hsl(282 92% 66%);
  --nft-cyan: hsl(190 96% 63%);
  --nft-pink: hsl(327 93% 68%);

  --blueprint-blue: hsl(214 100% 68%);
  --blueprint-cyan: hsl(185 91% 72%);
  --blueprint-ink: hsl(217 54% 14%);

  /* --------------------------------------------------------- */
  /* Default Semantic Tokens                                    */
  /* --------------------------------------------------------- */
  --color-primary: var(--f1-red);
  --color-accent: var(--f1-gold);
  --color-highlight: var(--f1-orange);

  --bg-app: hsl(220 14% 7%);
  --bg-elev-1: hsl(220 12% 9%);
  --bg-elev-2: hsl(220 11% 12%);
  --bg-carbon: hsl(220 12% 8%);
  --bg-blueprint: hsl(217 54% 14%);
  --bg-nft: hsl(250 25% 11%);

  --text-strong: var(--white-90);
  --text-body: hsl(220 10% 88% / 0.84);
  --text-muted: hsl(220 10% 88% / 0.58);

  --line-soft: var(--white-06);
  --line-strong: hsl(0 0% 100% / 0.14);
  --grid-line: hsl(0 0% 100% / 0.07);

  --surface-panel: linear-gradient(
    180deg,
    hsl(0 0% 100% / 0.08),
    hsl(0 0% 100% / 0.03)
  );
  --surface-glass: hsl(0 0% 100% / 0.07);
  --surface-glass-stroke: hsl(0 0% 100% / 0.12);

  --shadow-1: 0 0.5rem 1.5rem hsl(220 30% 2% / 0.22);
  --shadow-2: 0 1rem 3rem hsl(220 30% 2% / 0.34);
  --shadow-3: 0 2rem 6rem hsl(220 30% 2% / 0.48);

  /* --------------------------------------------------------- */
  /* Motion                                                     */
  /* --------------------------------------------------------- */
  --ease-standard: cubic-bezier(0.2, 0.7, 0.2, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.22, 1, 0.36, 1);

  --dur-fast: 180ms;
  --dur-mid: 320ms;
  --dur-slow: 720ms;

  /* --------------------------------------------------------- */
  /* 3D State                                                   */
  /* --------------------------------------------------------- */
  --perspective-product: 1400px;
  --model-rot-x: -18deg;
  --model-rot-y: -28deg;
  --model-scale: 1;
  --model-z-lift: 0rem;

  --paint-base: hsl(3 92% 56%);
  --paint-specular: hsl(14 100% 84%);
  --paint-shadow: hsl(356 72% 32%);
  --rim-glow: hsl(3 92% 56% / 0.28);

  --trim-metal: hsl(220 10% 78%);
  --trim-shadow: hsl(220 10% 32%);

  /* --------------------------------------------------------- */
  /* Lighting                                                   */
  /* --------------------------------------------------------- */
  --light-x: 50%;
  --light-y: 50%;
  --light-size: 34rem;
  --light-alpha: 0.2;

  /* --------------------------------------------------------- */
  /* Texture                                                    */
  /* --------------------------------------------------------- */
  --noise-opacity: 0.12;
  --grain-size-a: 1.1rem;
  --grain-size-b: 1.6rem;
  --glass-blur: 18px;
  --glass-saturate: 150%;
}
```

---

## 3. 테마 전환 토큰

테마는 개별 컴포넌트를 직접 다시 그리지 않고, 상위 semantic token을 교체한다.

## 3.1 F1 Theme
```css
#theme-f1:checked ~ .app-shell {
  --color-primary: var(--f1-red);
  --color-accent: var(--f1-gold);
  --color-highlight: var(--f1-orange);

  --bg-app: hsl(220 14% 7%);
  --bg-elev-1: hsl(220 12% 9%);
  --bg-elev-2: hsl(220 11% 12%);
  --grid-line: hsl(0 0% 100% / 0.06);
}
```

## 3.2 NFT Theme
```css
#theme-nft:checked ~ .app-shell {
  --color-primary: var(--nft-violet);
  --color-accent: var(--nft-cyan);
  --color-highlight: var(--nft-pink);

  --bg-app: hsl(250 25% 11%);
  --bg-elev-1: hsl(250 23% 13%);
  --bg-elev-2: hsl(250 20% 16%);
  --grid-line: hsl(190 96% 63% / 0.1);

  --surface-panel: linear-gradient(
    180deg,
    hsl(190 96% 63% / 0.1),
    hsl(282 92% 66% / 0.04)
  );
}
```

## 3.3 Blueprint Theme
```css
#theme-blueprint:checked ~ .app-shell {
  --color-primary: var(--blueprint-blue);
  --color-accent: var(--blueprint-cyan);
  --color-highlight: hsl(188 94% 82%);

  --bg-app: var(--bg-blueprint);
  --bg-elev-1: hsl(216 46% 17%);
  --bg-elev-2: hsl(216 38% 20%);
  --grid-line: hsl(185 91% 72% / 0.12);

  --surface-panel: linear-gradient(
    180deg,
    hsl(185 91% 72% / 0.08),
    hsl(185 91% 72% / 0.02)
  );
}
```

---

## 4. 기본 배경 환경

앱 전체의 배경은 단일 솔리드 컬러가 아니라, **3층 배경 구조**로 만든다.

```css
.app-shell {
  min-block-size: 100dvh;
  color: var(--text-strong);
  background:
    radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--color-primary) 18%, transparent), transparent 48%),
    linear-gradient(180deg, var(--bg-elev-1), var(--bg-app));
}
```

### Blueprint grid 오버레이
```css
.app-shell::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0 / 2rem 2rem,
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0 / 2rem 2rem;
  mask-image: linear-gradient(180deg, hsl(0 0% 100% / 0.8), transparent 85%);
  opacity: 0.35;
}
```

---

## 5. 타이포그래피 토큰 사용 규칙

```css
body {
  font-family: var(--font-body);
  font-size: var(--text-md);
  line-height: 1.55;
  color: var(--text-body);
}

.hero-title {
  font-family: var(--font-display);
  font-size: var(--text-hero);
  line-height: 0.92;
  letter-spacing: -0.04em;
  color: var(--text-strong);
}

.eyebrow,
.card-kicker,
.model-annotation {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted);
}
```

---

## 6. 3D 환경 셋업

## 6.1 부모 perspective 규칙
판매 섹션의 3D 씬은 부모가 원근을 가진다.

```css
.market-stage {
  display: grid;
  grid-template-columns: minmax(18rem, 1.15fr) minmax(18rem, 0.85fr);
  align-items: center;
  gap: clamp(1.5rem, 3vw, 3rem);
}

.product-scene {
  position: relative;
  perspective: var(--perspective-product);
  perspective-origin: 50% 42%;
}
```

### 권장 수치
- 기본: `1200px ~ 1600px`
- 제품이 과하게 왜곡되면 더 큰 값
- 깊이가 약하면 더 작은 값

**Velocity Vault 기본값: `1400px`**

## 6.2 자식 preserve-3d 규칙
```css
.product-3d-model {
  position: relative;
  inline-size: min(42rem, 90vw);
  aspect-ratio: 1 / 1;
  transform-style: preserve-3d;
  transform:
    translateZ(var(--model-z-lift))
    rotateX(var(--model-rot-x))
    rotateY(var(--model-rot-y))
    scale(var(--model-scale));
  transition:
    transform 700ms var(--ease-spring),
    filter 240ms ease,
    opacity 180ms ease;
}

.product-3d-model > * {
  position: absolute;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}
```

## 6.3 카메라 상태 토큰
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

---

## 7. 제품 파츠 표면 규칙

## 7.1 바디 표면
```css
.model-body {
  inset: 22% 18%;
  border-radius: 45% 45% 38% 38% / 32% 32% 48% 48%;
  background:
    linear-gradient(
      145deg,
      var(--paint-specular),
      var(--paint-base) 36%,
      var(--paint-shadow) 82%
    );
  box-shadow:
    0 0 0 1px hsl(0 0% 100% / 0.06) inset,
    0 0 2.5rem var(--rim-glow),
    var(--shadow-2);
  transform: translateZ(0);
}
```

## 7.2 캐노피
```css
.model-canopy {
  inset: 30% 34% 40% 34%;
  border-radius: 1.8rem;
  background:
    linear-gradient(
      180deg,
      hsl(0 0% 100% / 0.28),
      hsl(210 60% 20% / 0.16)
    );
  border: 1px solid hsl(0 0% 100% / 0.18);
  backdrop-filter: blur(10px) saturate(140%);
  transform: translateZ(1.6rem);
}
```

## 7.3 윙
```css
.model-wing {
  background:
    linear-gradient(180deg, hsl(0 0% 100% / 0.12), hsl(0 0% 0% / 0.18)),
    linear-gradient(90deg, hsl(0 0% 100% / 0.06), transparent 25%, transparent 75%, hsl(0 0% 0% / 0.18));
  border: 1px solid hsl(0 0% 100% / 0.08);
}

.model-wing--front {
  inset: 14% 16% auto 16%;
  block-size: 2.4rem;
  border-radius: 0.8rem;
  transform: translateZ(2.4rem) translateY(-5.6rem);
}

.model-wing--rear {
  inset: auto 20% 14% 20%;
  block-size: 2.2rem;
  border-radius: 0.8rem;
  transform: translateZ(-1.8rem) translateY(5.2rem);
}
```

## 7.4 휠
```css
.wheel {
  inline-size: 5.25rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 30%, hsl(0 0% 100% / 0.14), transparent 28%),
    radial-gradient(circle at 50% 50%, hsl(0 0% 0% / 0) 38%, hsl(0 0% 10%) 39%, hsl(0 0% 4%) 65%),
    linear-gradient(180deg, hsl(0 0% 22%), hsl(0 0% 8%));
  box-shadow:
    0 0 0 1px hsl(0 0% 100% / 0.06) inset,
    0 1rem 2rem hsl(0 0% 0% / 0.35);
}
```

---

## 8. 상태별 질감 전환

## 8.1 Paint 상태
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

## 8.2 Trim 상태
```css
#trim-carbon:checked ~ .app-shell {
  --trim-metal: hsl(220 10% 72%);
  --surface-panel: linear-gradient(
    180deg,
    hsl(0 0% 100% / 0.08),
    hsl(0 0% 100% / 0.02)
  );
}

#trim-brushed:checked ~ .app-shell {
  --trim-metal: hsl(220 12% 82%);
  --surface-panel: linear-gradient(
    180deg,
    hsl(0 0% 100% / 0.12),
    hsl(0 0% 100% / 0.04)
  );
}
```

---

## 9. Exploded 상태 토큰

exploded view는 각 부품의 `translate3d()`만 바꾼다.  
즉, 모델 전체를 갈아끼우지 않고 **부품 간 상대 거리만 조정**한다.

```css
#explode-off:checked ~ .app-shell .model-wing--front {
  transform: translateZ(2.4rem) translateY(-5.6rem);
}

#explode-on:checked ~ .app-shell .model-wing--front {
  transform: translateZ(6rem) translateY(-8rem);
}

#explode-on:checked ~ .app-shell .wheel--fl {
  transform: translate3d(-4.5rem, -1rem, 5.8rem) rotateY(-26deg);
}

#explode-on:checked ~ .app-shell .wheel--fr {
  transform: translate3d(4.5rem, -1rem, 5.8rem) rotateY(26deg);
}

#explode-on:checked ~ .app-shell .wheel--rl {
  transform: translate3d(-4.2rem, 1.2rem, -5.2rem) rotateY(-18deg);
}

#explode-on:checked ~ .app-shell .wheel--rr {
  transform: translate3d(4.2rem, 1.2rem, -5.2rem) rotateY(18deg);
}
```

---

## 10. Knowledge 섹션 조명 토큰

`.knowledge-stage`는 조명 레이어를 가진다.

```css
.knowledge-stage {
  position: relative;
  isolation: isolate;
  transition:
    --light-x var(--dur-mid) var(--ease-standard),
    --light-y var(--dur-mid) var(--ease-standard),
    --light-alpha var(--dur-fast) ease;
}

.knowledge-stage::before {
  content: "";
  position: absolute;
  inset: -10%;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle var(--light-size) at var(--light-x) var(--light-y),
      color-mix(in srgb, var(--color-primary) 30%, transparent),
      transparent 70%
    );
  opacity: var(--light-alpha);
  transition:
    background-position var(--dur-mid) ease,
    opacity var(--dur-fast) ease,
    transform var(--dur-mid) ease;
  filter: blur(28px);
}
```

### 카드 내부 분면에 따른 광원 이동
```css
.knowledge-stage:has(.card--aero .hover-cell--nw:hover) { --light-x: 26%; --light-y: 26%; }
.knowledge-stage:has(.card--aero .hover-cell--ne:hover) { --light-x: 42%; --light-y: 24%; }
.knowledge-stage:has(.card--aero .hover-cell--sw:hover) { --light-x: 28%; --light-y: 44%; }
.knowledge-stage:has(.card--aero .hover-cell--se:hover) { --light-x: 44%; --light-y: 46%; }

.knowledge-stage:has(.card--telemetry .hover-cell--nw:hover) { --light-x: 64%; --light-y: 54%; }
.knowledge-stage:has(.card--telemetry .hover-cell--ne:hover) { --light-x: 78%; --light-y: 54%; }
.knowledge-stage:has(.card--telemetry .hover-cell--sw:hover) { --light-x: 66%; --light-y: 74%; }
.knowledge-stage:has(.card--telemetry .hover-cell--se:hover) { --light-x: 80%; --light-y: 74%; }
```

---

## 11. 질감(Texture) 규칙 — 이미지 없이 만들기

## 11.1 카본 파이버 질감
F1 테마의 주요 질감은 반복 선형 그라데이션으로 만든다.

```css
.texture-carbon {
  background:
    linear-gradient(135deg, hsl(0 0% 15%) 25%, transparent 25%) -0.5rem 0 / 1rem 1rem,
    linear-gradient(225deg, hsl(0 0% 19%) 25%, transparent 25%) -0.5rem 0 / 1rem 1rem,
    linear-gradient(315deg, hsl(0 0% 11%) 25%, transparent 25%) 0 0 / 1rem 1rem,
    linear-gradient(45deg,  hsl(0 0% 17%) 25%, transparent 25%) 0 0 / 1rem 1rem,
    linear-gradient(180deg, hsl(0 0% 16%), hsl(0 0% 9%));
}
```

## 11.2 노이즈 레이어
실제 랜덤 노이즈가 아니라, 여러 개의 작은 radial gradient를 엇갈리게 깔아 grain처럼 보이게 만든다.

```css
.has-noise::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: soft-light;
  opacity: var(--noise-opacity);
  background:
    radial-gradient(circle at 20% 20%, hsl(0 0% 100% / 0.08) 0 0.06rem, transparent 0.08rem) 0 0 / var(--grain-size-a) var(--grain-size-a),
    radial-gradient(circle at 75% 35%, hsl(0 0% 100% / 0.05) 0 0.05rem, transparent 0.08rem) 0.25rem 0.35rem / var(--grain-size-b) var(--grain-size-b),
    radial-gradient(circle at 35% 80%, hsl(0 0% 0% / 0.14) 0 0.06rem, transparent 0.1rem) 0 0 / calc(var(--grain-size-a) * 1.2) calc(var(--grain-size-a) * 1.2);
}
```

## 11.3 브러시드 메탈
```css
.texture-brushed {
  background:
    linear-gradient(
      90deg,
      hsl(0 0% 100% / 0.08) 0%,
      hsl(0 0% 100% / 0.02) 12%,
      hsl(0 0% 0% / 0.06) 20%,
      hsl(0 0% 100% / 0.03) 30%,
      hsl(0 0% 0% / 0.08) 55%,
      hsl(0 0% 100% / 0.04) 75%,
      hsl(0 0% 0% / 0.06) 100%
    );
}
```

---

## 12. 유리 질감(Glass) 규칙

```css
.glass-panel {
  background: var(--surface-glass);
  border: 1px solid var(--surface-glass-stroke);
  box-shadow:
    0 1rem 3rem hsl(220 30% 2% / 0.28),
    0 0 0 1px hsl(0 0% 100% / 0.02) inset;
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
}
```

### 권장 수치
- `blur`: `14px ~ 22px`
- `saturate`: `130% ~ 170%`
- 배경 불투명도: `0.05 ~ 0.12`

### 주의
- full-screen glass는 금지
- panel 단위로만 적용
- backdrop-filter는 반드시 fallback 배경색을 가진다

---

## 13. NFT 카드 / 플라크 질감

```css
.nft-plaque {
  inset: 38% 36%;
  border-radius: 1.25rem;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-accent) 32%, transparent),
      transparent 36%,
      color-mix(in srgb, var(--color-primary) 26%, transparent) 68%,
      transparent
    ),
    linear-gradient(180deg, hsl(0 0% 100% / 0.1), hsl(0 0% 100% / 0.02));
  border: 1px solid hsl(0 0% 100% / 0.12);
  box-shadow:
    0 0 0 1px hsl(0 0% 100% / 0.04) inset,
    0 0 3rem color-mix(in srgb, var(--color-primary) 22%, transparent);
  transform: translateZ(2.8rem) rotateX(8deg);
}
```

### 에디션별 foil 강도
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

## 14. 선택 상태 UI 토큰

label 기반 control도 토큰을 소비해야 한다.

```css
.chip,
.nav-chip,
.theme-pill,
.swatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--line-soft);
  background: hsl(0 0% 100% / 0.03);
  color: var(--text-body);
  cursor: pointer;
  transition:
    transform var(--dur-fast) ease,
    border-color var(--dur-fast) ease,
    background-color var(--dur-fast) ease,
    color var(--dur-fast) ease,
    box-shadow var(--dur-fast) ease;
}
```

### 선택 상태
```css
#view-market:checked ~ .app-shell label[for="view-market"],
#theme-blueprint:checked ~ .app-shell label[for="theme-blueprint"],
#camera-top:checked ~ .app-shell label[for="camera-top"],
#edition-founder:checked ~ .app-shell label[for="edition-founder"] {
  color: var(--text-strong);
  border-color: color-mix(in srgb, var(--color-primary) 60%, white 12%);
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
  box-shadow: 0 0 1.5rem color-mix(in srgb, var(--color-primary) 20%, transparent);
  transform: translateY(-1px);
}
```

---

## 15. 반응형 토큰 조정

모바일에서는 perspective와 blur, 3D 이동량을 줄인다.

```css
@media (max-width: 64rem) {
  :root {
    --perspective-product: 1200px;
    --light-size: 28rem;
    --glass-blur: 14px;
  }
}

@media (max-width: 48rem) {
  :root {
    --perspective-product: 960px;
    --light-size: 22rem;
    --noise-opacity: 0.08;
  }

  .market-stage {
    grid-template-columns: 1fr;
  }

  .product-3d-model {
    inline-size: min(32rem, 100%);
  }
}
```

---

## 16. 최종 원칙

Velocity Vault의 디자인 시스템은 아래 4원칙으로 요약된다.

1. **테마는 semantic token을 바꾼다.**
2. **상태는 state token을 바꾼다.**
3. **컴포넌트는 token을 소비할 뿐, 상태를 직접 모른다.**
4. **3D는 perspective와 layer depth의 합이다.**

즉, “빨간 바디를 가진 founder edition의 top view”는 특별한 컴포넌트를 새로 만드는 것이 아니라,  
**여러 input이 토큰을 덮고, 같은 컴포넌트가 그 토큰을 다시 렌더링하는 것**으로 해결한다.
