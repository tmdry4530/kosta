# CSS 흑마법 기술 명세서

이 프로젝트의 기술 스택은 단순하다.  
단순하다는 것은 약하다는 뜻이 아니라, **브라우저가 직접 이해하는 원시 도구만으로 상태·시간축·공간감을 만드는 것**을 의미한다.

---

## 1. 허용 스택 / 금지 스택

## 1.1 허용
- **HTML5**
- **브라우저 네이티브 CSS**
  - CSS Custom Properties
  - `@property` 등록형 custom property
  - CSS Nesting
  - `:has()`
  - `@keyframes`
  - `animation-timeline`
  - `scroll-timeline`
  - `animation-range`
  - `perspective`
  - `transform-style: preserve-3d`
  - `backdrop-filter`
  - `@supports`
  - `@media (prefers-reduced-motion: reduce)`

## 1.2 금지
- JavaScript 런타임
- 인라인 이벤트 속성
- React/Vue/Svelte/Next/Nuxt/Astro의 클라이언트 하이드레이션
- Sass/Less/Stylus
- Tailwind의 런타임성 class 조합 전제
- GSAP / Framer Motion / Three.js / WebGL / canvas
- 상태 계산을 위한 서버 의존 로직

---

## 2. 스타일시트 계층 구조

순수 CSS 프로젝트일수록 cascade를 의식적으로 설계해야 한다. 다음 layer 순서를 권장한다.

```css
@layer reset, tokens, base, layout, components, states, motion, utilities;
```

### 역할
- `reset`: 기본 브라우저 차이 제거
- `tokens`: `:root`와 theme token
- `base`: `html`, `body`, typography, links
- `layout`: grid, section scaffolding
- `components`: card, chip, panel, model parts
- `states`: `:checked`, `:has()`, `:focus-visible`
- `motion`: keyframes, timelines
- `utilities`: 한정적 utility

이 순서의 장점은 명확하다.  
**정적인 모양은 먼저**, **상태와 애니메이션은 뒤에서 덮는다**.

---

## 3. 핵심 기법 1 — Scroll-driven Animations

## 3.1 개념
시간이 아니라 **스크롤 진도**가 애니메이션 progress를 공급한다.  
Velocity Vault에서는 Story 섹션의 타이포그래피, exploded part, CTA reveal을 여기에 묶는다.

## 3.2 두 가지 방식

### A. 익명(anonymous) 스크롤 타임라인
문서 루트 스크롤 또는 가장 가까운 scroller를 직접 참조한다.

```css
.hero-title {
  animation: hero-title-parallax 1ms linear both;
  animation-timeline: scroll(root block);
  animation-range: 0% 35%;
}
```

### B. 이름 붙은(named) 스크롤 타임라인
특정 scroller에 timeline 이름을 부여하고, 그 자손이 그 이름을 소비한다.

```css
.story-scroll-host {
  overflow-y: auto;
  block-size: 100dvh;
  scroll-timeline: --story block;
}

.story-track {
  min-block-size: 420vh;
}

.hero-title {
  animation: hero-title-parallax 1ms linear both;
  animation-timeline: --story;
  animation-range: 0% 35%;
}
```

## 3.3 왜 named timeline을 기본으로 삼는가
- Story 섹션의 스크롤만 독립적으로 제어하기 쉽다.
- 다른 view가 겹쳐 있어도 timeline 범위를 격리하기 쉽다.
- root scroll에 종속되지 않아 섹션 단위 재사용성이 높다.

## 3.4 `@scroll-timeline` 문맥
과거 예제와 일부 문서에서는 `@scroll-timeline`을 볼 수 있지만, 이 프로젝트 문서에서는 **현재 저작 패턴을 기준으로 `scroll-timeline` / `scroll-timeline-name` / `scroll-timeline-axis` + `animation-timeline` 조합**을 표준 문법으로 사용한다.

### 권장 패턴
```css
.story-scroll-host {
  scroll-timeline-name: --story;
  scroll-timeline-axis: block;
}
```

또는 축약형:

```css
.story-scroll-host {
  scroll-timeline: --story block;
}
```

## 3.5 중요 함정: `animation` shorthand reset
스크롤 애니메이션을 만들 때 가장 흔한 실수는 `animation-timeline`을 먼저 선언해 놓고, 아래에서 `animation` shorthand가 그것을 리셋해 버리는 것이다.

### 잘못된 예
```css
.hero-title {
  animation-timeline: --story;
  animation: hero-title-parallax 1ms linear both;
}
```

### 올바른 예
```css
.hero-title {
  animation: hero-title-parallax 1ms linear both;
  animation-timeline: --story;
  animation-range: 0% 35%;
}
```

### 프로젝트 규칙
- `animation`을 먼저 쓴다.
- `animation-timeline`을 그 뒤에 쓴다.
- `animation-range`도 `animation` 뒤에 쓴다.

## 3.6 권장 키프레임 예시
```css
@keyframes hero-title-parallax {
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  35%  { transform: translateY(-8vh) scale(1.08); opacity: 1; }
  70%  { transform: translateY(-16vh) scale(1.16); opacity: 0.4; }
  100% { transform: translateY(-20vh) scale(1.2); opacity: 0; }
}

@keyframes assembly-reveal {
  0%   { transform: translateZ(-8rem) rotateX(-18deg) scale(0.84); opacity: 0; }
  100% { transform: translateZ(0) rotateX(0deg) scale(1); opacity: 1; }
}
```

## 3.7 지원 차이를 고려한 방어 코드
```css
@supports (animation-timeline: scroll()) {
  .story-scroll-host {
    scroll-timeline: --story block;
  }

  .hero-title {
    animation: hero-title-parallax 1ms linear both;
    animation-timeline: --story;
    animation-range: 0% 35%;
  }
}

@supports not (animation-timeline: scroll()) {
  .hero-title,
  .exploded-assembly,
  .story-cta {
    animation: none;
    transform: none;
    opacity: 1;
  }
}
```

---

## 4. 핵심 기법 2 — Context-Aware UI with `:has()`

## 4.1 목적
`hover`된 하위 요소를 기준으로 상위 컨테이너, 형제 카드, 배경 텍스트를 동시에 바꾼다.

## 4.2 공식
```css
.container:has(.child:hover) .sibling { ... }
```

이 패턴이 의미하는 것은 간단하다.  
**“하위에 특정 상태가 존재하면 상위 문맥을 바꾸고, 그 문맥 안의 다른 요소까지 재조정한다.”**

## 4.3 Velocity Vault 공식

### 카드 활성화
```css
.bento-card:has(.hover-cell:hover) {
  transform: translateY(-0.5rem);
  border-color: var(--color-primary);
}
```

### 비활성 카드 흐림 처리
```css
.knowledge-stage:has(.bento-card:has(.hover-cell:hover)) .bento-card:not(:has(.hover-cell:hover)) {
  filter: blur(5px) brightness(0.5) saturate(0.65);
  transform: scale(0.96);
  opacity: 0.72;
}
```

### 배경 텍스트 교체
```css
.knowledge-stage:has(.card--aero .hover-cell:hover) .word--aero,
.knowledge-stage:has(.card--tire .hover-cell:hover) .word--tire,
.knowledge-stage:has(.card--brake .hover-cell:hover) .word--brake,
.knowledge-stage:has(.card--telemetry .hover-cell:hover) .word--telemetry {
  opacity: 1;
  transform: translateY(0);
}
```

## 4.4 OR / AND 논리
`:has()`는 조합 가능하다.

### OR
```css
.knowledge-stage:has(.card--aero .hover-cell:hover, .card--tire .hover-cell:hover) { ... }
```

### AND
```css
.knowledge-stage:has(.card--aero .hover-cell:hover):has(.card--telemetry .hover-cell:hover) { ... }
```

Velocity Vault에서는 대부분 단일 활성 카드만 허용하므로 AND 패턴은 드물지만, 복합 상태 표현이 필요한 디버그 모드나 이스터에그에 유용하다.

## 4.5 성능 원칙
- `:has()`는 최상위 `body` 전체보다 **섹션 컨테이너 범위**에서 사용한다.
- 권장: `.knowledge-stage:has(...)`
- 지양: `body:has(...)`를 과도하게 남발


## 4.6 움직이는 custom property는 등록한다
광원 좌표처럼 `background` 내부에서 소비되는 custom property는 등록하지 않으면 값이 튀듯이 바뀌기 쉽다.  
따라서 Velocity Vault는 조명 좌표를 `@property`로 등록한다.

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

```css
.knowledge-stage {
  transition:
    --light-x var(--dur-mid) var(--ease-standard),
    --light-y var(--dur-mid) var(--ease-standard),
    --light-alpha var(--dur-fast) ease;
}
```

---

## 5. 핵심 기법 3 — Radio/Checkbox State Management

## 5.1 철학
이 프로젝트에서 input은 폼 필드가 아니라 **CSS 상태 저장소**다.

### 기본 문법
```css
#state-id:checked ~ .app-shell .target {
  ...
}
```

## 5.2 왜 radio를 우선하는가
- 상호 배타적 상태에 적합하다.
- 색상/테마/카메라/화면 전환처럼 하나만 활성화되어야 하는 그룹에 이상적이다.

## 5.3 checkbox를 쓰는 경우
- on/off가 동시에 독립적으로 필요한 상태
- 예: “glare overlay on/off”, “annotation layer on/off”, “grid overlay on/off”

하지만 exploded view처럼 “assembled vs exploded”가 양자택일이면 checkbox보다 radio pair가 예측 가능하다.

## 5.4 추천 규칙
- 상호 배타적 상태: radio
- 독립 토글: checkbox
- 동일 범위의 상태끼리는 `name`을 일관되게 유지한다.

### 예시
```html
<input type="radio" name="camera" id="camera-isometric" checked>
<input type="radio" name="camera" id="camera-side">
<input type="radio" name="camera" id="camera-top">
```

```css
#camera-isometric:checked ~ .app-shell .product-3d-model {
  --model-rot-x: -18deg;
  --model-rot-y: -28deg;
  --model-scale: 1;
}

#camera-top:checked ~ .app-shell .product-3d-model {
  --model-rot-x: -82deg;
  --model-rot-y: 0deg;
  --model-scale: 1.06;
}
```

---

## 6. 네이티브 CSS Nesting 규칙

CSS Nesting은 선택자 반복을 줄이는 데 유용하지만, 무분별한 중첩은 오히려 상태 추적을 어렵게 만든다.  
이 프로젝트는 **최대 2단 중첩**을 권장한다.

### 권장
```css
.market-stage {
  display: grid;
  gap: clamp(1.5rem, 3vw, 3rem);

  & .control-panel {
    display: grid;
    gap: 1rem;
  }

  & .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
}
```

### 비권장
```css
.market-stage {
  & .control-panel {
    & .control-group {
      & .chip-row {
        & .chip {
          ...
        }
      }
    }
  }
}
```

### 이유
- `:checked ~ .app-shell` 같은 전역 selector는 이미 길다.
- component 내부까지 과도하게 중첩하면 디버깅 비용이 급상승한다.

---

## 7. 3D 렌더링 규칙

## 7.1 부모는 perspective를 가진다
```css
.product-scene {
  perspective: 1400px;
  perspective-origin: 50% 42%;
}
```

## 7.2 자식은 preserve-3d를 가진다
```css
.product-3d-model {
  transform-style: preserve-3d;
}
```

## 7.3 면과 부품은 translateZ로 깊이를 나눈다
```css
.model-body        { transform: translateZ(0); }
.model-canopy      { transform: translateZ(1.4rem); }
.model-wing--front { transform: translateZ(2.2rem) translateY(-5rem); }
.model-wing--rear  { transform: translateZ(-2rem) translateY(5rem); }
```

## 7.4 backface 처리
```css
.product-3d-model > * {
  backface-visibility: hidden;
}
```

## 7.5 카메라 회전은 부모에서 통합
부품 개별 rotate보다 모델 루트 회전을 우선한다.

```css
.product-3d-model {
  transform:
    rotateX(var(--model-rot-x))
    rotateY(var(--model-rot-y))
    scale(var(--model-scale));
}
```

---

## 8. 상태 토큰 패턴

직접 모든 속성을 덮기보다, **상태 → 토큰 변경 → 컴포넌트 반영**의 2단계를 사용한다.

### 권장
```css
#color-red:checked ~ .app-shell {
  --paint-base: hsl(3 92% 56%);
  --paint-specular: hsl(14 100% 84%);
  --rim-glow: hsl(3 92% 56% / 0.34);
}

.product-3d-model .model-body {
  background:
    linear-gradient(145deg, var(--paint-specular), var(--paint-base) 45%, var(--paint-shadow));
  box-shadow: 0 0 2rem var(--rim-glow);
}
```

### 비권장
```css
#color-red:checked ~ .app-shell .model-body {
  background: ...;
  box-shadow: ...;
  border-color: ...;
  outline-color: ...;
  ...
}
```

### 이유
- 테마와 색상 상태가 충돌할 때 토큰 방식이 훨씬 관리 가능하다.
- 하나의 state가 여러 컴포넌트에 영향을 줄 때 재사용이 쉽다.

---

## 9. 최적화 규칙

## 9.1 기본 원칙
가급적 **`transform`과 `opacity`만 애니메이션**한다.  
이 두 속성은 브라우저가 합성(compositing) 단계에서 처리하기 쉽다.

### 권장
- `transform: translate3d(...)`
- `transform: scale(...)`
- `transform: rotateX()/rotateY()/translateZ()`
- `opacity`

### 제한적으로 허용
- `filter: blur()` → bento card 같은 작은 표면에만
- `backdrop-filter` → glass panel 같은 제한적 UI에만

## 9.2 `will-change`
항상 켜두는 플래그가 아니다. 실제로 움직이는 핵심 요소에만 사용한다.

```css
.hero-title,
.exploded-assembly,
.product-3d-model,
.knowledge-stage::before {
  will-change: transform, opacity;
}
```

### 금지
- 전체 페이지 wrapper에 `will-change`
- 수십 개 카드 전부에 상시 `will-change`

## 9.3 contain / content-visibility
정적이고 아래쪽에 위치한 정보 카드에는 보수적으로 적용 가능하다.

```css
.bento-card {
  contain: layout paint;
}

.market-copy,
.long-form-annotation {
  content-visibility: auto;
  contain-intrinsic-size: 700px;
}
```

## 9.4 blur 예산
`blur(5px)`는 요구사항상 허용하지만, full-screen overlay에 적용하면 비용이 크다.  
반드시 **비활성 카드 개별 요소**에만 적용한다.

```css
.knowledge-stage:has(.bento-card:has(.hover-cell:hover)) .bento-card:not(:has(.hover-cell:hover)) {
  filter: blur(5px) brightness(0.5);
}
```

---

## 10. 접근성 / 감속 모드

scroll-linked motion과 3D 전환은 시각적 임팩트가 크므로 감속 모드가 필수다.

```css
@media (prefers-reduced-motion: reduce) {
  .hero-title,
  .exploded-assembly,
  .callout,
  .product-3d-model,
  .word {
    animation: none !important;
    transition-duration: 0ms !important;
    transform: none !important;
  }

  .knowledge-stage::before {
    opacity: 0.18;
  }
}
```

### 추가 원칙
- 색상만으로 상태를 표현하지 않는다.
- 선택된 chip/label은 border, glow, icon, text weight로도 드러나야 한다.
- 키보드 접근을 위해 `:focus-visible` 스타일을 제공한다.

---

## 11. 추천 CSS 파일 분할

프레임워크 없이도 파일을 논리적으로 분해한다.

```text
styles/
  00-reset.css
  01-tokens.css
  02-base.css
  03-layout.css
  04-story.css
  05-knowledge.css
  06-market.css
  07-states.css
  08-motion.css
  09-utilities.css
```

### 핵심 원칙
- 상태 selector는 되도록 `07-states.css`
- keyframes / timeline은 `08-motion.css`
- 토큰은 오직 `01-tokens.css`
- 컴포넌트 구조는 섹션별 파일에 유지

---

## 12. 최종 요약

Velocity Vault의 기술 스택은 아래 세 문장으로 요약된다.

1. **스크롤은 timeline이다.**
2. **input은 state store다.**
3. **`:has()`는 context resolver다.**

그리고 이 세 문장을 성립시키는 실전 규칙은 다음이다.

- `animation` shorthand 뒤에 `animation-timeline`을 쓴다.
- named timeline은 scroller에 선언한다.
- 전역 상태는 input 형제로 올린다.
- `:has()`는 섹션 범위에서만 쓴다.
- GPU 친화적 움직임은 `transform`/`opacity` 위주로 설계한다.

이 다섯 가지를 지키면, JS 없는 인터랙션도 장난감이 아니라 **아키텍처**가 된다.
