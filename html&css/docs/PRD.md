# The Velocity Vault
## 제품 요구사항 및 한계 돌파 선언서

### 1. 제품 한 줄 정의
**The Velocity Vault**는 `F1 부품 해설 + 엔지니어링 지식 전달 + NFT 판매 쇼룸`을 하나의 연속된 CSS 네이티브 경험으로 결합한 웹사이트다.  
JavaScript 없이도 “스크롤로 서사를 열고”, “호버로 지식을 밝히고”, “체크 상태로 3D 상품을 바꾸는” 구조를 만든다.

---

## 2. 한계 돌파 선언

이 프로젝트는 “JS가 없으면 인터랙션이 얕다”는 전제를 뒤집는다. 다만, **가능한 것과 불가능한 것을 정확히 구분한 뒤 설계로 우회**한다.

### 2.1 우리가 끝까지 밀어붙일 것
1. **Scroll-driven storytelling**
   - `animation-timeline`, `scroll-timeline`, `animation-range`를 사용해 F1 파츠 소개를 스크롤 진도와 동기화한다.
2. **Context-aware knowledge UI**
   - `:has()`와 카드 내부 hover cell을 사용해 “어떤 카드의 어느 영역을 보고 있는지”를 CSS만으로 근사한다.
3. **CSS-only product configurator**
   - `input[type="radio"]`, `input[type="checkbox"]`의 `:checked` 상태를 전역 상태 저장소처럼 사용한다.
4. **DOM-based 3D showroom**
   - `perspective`, `transform-style: preserve-3d`, `translateZ()`로 CSS 조립형 3D 오브젝트를 구성한다.

### 2.2 우리가 정직하게 인정할 한계
1. **연속적인 마우스 좌표 추적은 불가**
   - CSS는 포인터의 실시간 `x/y` 좌표를 읽지 못한다.
   - 따라서 “픽셀 단위 추적” 대신 **카드 내부 2x2 또는 3x3 hover mesh**로 좌표를 양자화한다.
2. **진짜 WebGL/GLTF 모델 뷰어는 불가**
   - 제품 “3D 모델”은 GLB 렌더러가 아니라 **DOM 레이어와 pseudo-element로 만든 CSS 조립형 모델**이다.
3. **지갑 연결/민팅 로직은 불가**
   - 온체인 연결, 지갑 서명, 실시간 재고 API는 JS 없이는 처리할 수 없다.
   - 판매 섹션은 **CSS-only 구성기 + 정적 checkout/mint handoff 링크**로 설계한다.
4. **하드 리프레시 후 상태 영속성은 제한적**
   - `:checked` 상태는 세션 렌더 상태이지 애플리케이션 스토어가 아니다.
   - 새로고침 이후의 복원은 별도 서버 렌더 상태 또는 다중 정적 엔트리 페이지가 있어야 한다.

---

## 3. 제품 목표

### 3.1 비즈니스 목표
- F1 부품의 기술적 매력을 “판매 가능한 서사”로 전환한다.
- NFT를 단순 썸네일이 아닌 **엔지니어링 문맥이 부여된 collectible**로 제시한다.
- 지식 콘텐츠와 상품 섹션이 분리되지 않고, 하나의 스토리 파이프라인으로 이어지게 한다.

### 3.2 사용자 경험 목표
- 스크롤만으로 “무엇을 보고 있는지” 즉시 이해한다.
- 특정 개념 위에 포인터를 올리면 나머지 정보가 배경으로 밀리고, 현재 개념만 전면으로 부상한다.
- 색상/카메라/에디션을 바꾸는 즉시 모델과 CTA가 동기화되어 변한다.

---

## 4. 핵심 경험: 3 Phases

## Phase 1. Scroll-driven Storytelling
### 목적
F1 부품 소개를 영상처럼 소비시키지 않고, **사용자의 스크롤이 곧 편집 타임라인**이 되게 만든다.

### 화면 구조
- `view--story`
  - `.story-scroll-host`
  - `.story-track`
  - `.story-stage`
  - `.story-hero`
  - `.exploded-assembly`
  - `.callout-rail`
  - `.story-cta`

### 요구사항
- Hero 타이틀은 스크롤 0% → 35% 구간에서 확대/상승/페이드 아웃된다.
- Exploded assembly는 18% → 62% 구간에서 `translateZ`, `rotateX`, `opacity` 변화로 등장한다.
- 파츠 콜아웃은 각기 다른 `animation-range`를 가져 스크롤 순차 등장한다.
- CTA는 78% 이후부터만 등장한다.

### 구현 예시
```css
.story-scroll-host {
  block-size: 100dvh;
  overflow-y: auto;
  scroll-timeline: --story block;
}

.hero-title {
  animation: hero-title-parallax 1ms linear both;
  animation-timeline: --story;
  animation-range: 0% 35%;
}

.exploded-assembly {
  animation: assembly-reveal 1ms linear both;
  animation-timeline: --story;
  animation-range: 18% 62%;
}
```

```css
@keyframes hero-title-parallax {
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  60%  { transform: translateY(-10vh) scale(1.1); opacity: 1; }
  100% { transform: translateY(-20vh) scale(1.18); opacity: 0; }
}
```

---

## Phase 2. Context-aware Bento Knowledge Grid
### 목적
지식 전달 섹션을 단순 카드 목록이 아닌, **현재 개념에만 광원을 집중시키는 분석 인터페이스**로 만든다.

### 핵심 원리
- `.knowledge-stage:has(.bento-card:has(.hover-cell:hover))`
- 호버된 카드가 있으면 나머지 카드는 흐려지고 어두워진다.
- 카드 내부를 4분할한 `.hover-cell`이 광원 위치를 바꾼다.
- 배경의 큰 키워드는 카드별로 cross-fade 된다.

### 화면 구조
- `view--knowledge`
  - `.knowledge-stage`
  - `.knowledge-lexicon`
  - `.bento-grid`
  - `.bento-card.card--aero`
  - `.bento-card.card--tire`
  - `.bento-card.card--brake`
  - `.bento-card.card--telemetry`

### 구현 예시
```css
.knowledge-stage:has(.bento-card:has(.hover-cell:hover)) .bento-card:not(:has(.hover-cell:hover)) {
  filter: blur(5px) brightness(0.5) saturate(0.65);
  transform: scale(0.96);
  opacity: 0.72;
}

.knowledge-stage:has(.card--aero .hover-cell--ne:hover) {
  --light-x: 72%;
  --light-y: 24%;
}

.knowledge-stage:has(.card--brake .hover-cell--sw:hover) {
  --light-x: 28%;
  --light-y: 76%;
}
```

### 배경 단어 전환
`content` 문자열 교체 대신, 미리 쌓아둔 단어 레이어의 `opacity`를 바꾼다.

```css
.word {
  opacity: 0;
  transform: translateY(1rem);
  transition: opacity 220ms ease, transform 320ms ease;
}

.knowledge-stage:has(.card--aero .hover-cell:hover) .word--aero,
.knowledge-stage:has(.card--tire .hover-cell:hover) .word--tire,
.knowledge-stage:has(.card--brake .hover-cell:hover) .word--brake,
.knowledge-stage:has(.card--telemetry .hover-cell:hover) .word--telemetry {
  opacity: 1;
  transform: translateY(0);
}
```

---

## Phase 3. CSS-only 3D Product / NFT Configurator
### 목적
판매 섹션에서 “보는 경험”과 “구성하는 경험”을 분리하지 않는다. 사용자는 라디오/체크 상태로 상품, 카메라, 에디션을 바꾸고 그 결과가 즉시 모델과 CTA에 반영된다.

### 상태 그룹
- `name="paint"` → `#color-red`, `#color-silver`, `#color-obsidian`
- `name="trim"` → `#trim-carbon`, `#trim-brushed`
- `name="camera"` → `#camera-isometric`, `#camera-side`, `#camera-top`
- `name="explode"` → `#explode-off`, `#explode-on`
- `name="edition"` → `#edition-core`, `#edition-rare`, `#edition-founder`

### 구현 예시
```css
#color-red:checked ~ .app-shell {
  --paint-base: hsl(3 92% 56%);
  --paint-specular: hsl(14 100% 84%);
  --rim-glow: hsl(3 92% 56% / 0.34);
}

#camera-side:checked ~ .app-shell .product-3d-model {
  --model-rot-x: 0deg;
  --model-rot-y: -90deg;
  --model-scale: 1.02;
}

#explode-on:checked ~ .app-shell .wheel--fl {
  transform: translate3d(-4.5rem, 1.2rem, 6rem) rotateY(-26deg);
}
```

### 판매 CTA 원칙
동적 URL 조합은 JS 없이 불가능하므로, 조합별 앵커를 미리 선언한 뒤 상태에 따라 보이게 한다.

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

---

## 5. 엄격한 제약 사항

### 절대 금지
- 외부 JS 파일 생성
- `<script>` 태그 삽입
- `onclick`, `onchange`, `onmouseover` 같은 인라인 이벤트 속성
- React/Vue/Svelte 등 런타임 프레임워크
- Sass/Less/Stylus 같은 전처리기
- canvas/WebGL 기반 3D 렌더링
- 상태 계산을 전제로 한 동적 URL 생성

### 강제 규칙
- **모든 persistent state는 HTML `<input>`의 `:checked`로 관리한다.**
- **모든 global state input은 `<body>` 바로 아래 또는 `.app-container` 최상단에 형제 요소로 배치한다.**
- **실제 UI는 input 뒤쪽에 배치하고 `~` 또는 `+` 선택자로 제어한다.**
- label이 button 역할을 대신한다.
- hover 기반 상태는 `:has()`와 `.hover-cell` 조합으로만 처리한다.

---

## 6. 기능 요구사항

## 6.1 글로벌 상태 전이
다음 상태는 전역 상태로 취급한다.

| 도메인 | ID 예시 | 저장 방식 | 범위 |
|---|---|---:|---|
| 화면 전환 | `#view-story` | radio | 전체 앱 |
| 테마 | `#theme-f1` | radio | 전체 앱 |
| 페인트 | `#color-red` | radio | 판매 섹션 중심이지만 전역 |
| 트림 | `#trim-carbon` | radio | 판매 섹션 |
| 카메라 | `#camera-side` | radio | 판매 섹션 |
| 폭발도 | `#explode-on` | checkbox or radio | 판매 섹션 |
| 에디션 | `#edition-founder` | radio | CTA/NFT 카드/가격표 |

## 6.2 접근성 요구
- 모든 숨김 input은 `display: none`을 쓰지 않고 label과 연결 가능한 형태로 DOM에 남겨둔다.
- 모든 제어 label은 실제 텍스트를 포함한다.
- `:focus-visible` 스타일을 제공한다.
- `prefers-reduced-motion: reduce`에서 scroll animation과 3D transition을 정지시킨다.
- 배경 텍스트 전환은 pseudo-element 문자열보다 실제 DOM 텍스트 레이어를 우선한다.

## 6.3 성능 요구
- 대형 움직임은 `transform`, `opacity` 위주로 설계한다.
- `filter: blur()`는 벤토 카드 같은 제한된 면적에만 허용한다.
- `backdrop-filter`는 글라스 패널에만 제한적으로 사용한다.
- `will-change`는 Hero, 모델, 조명 오버레이처럼 실제로 움직이는 요소에만 부여한다.

---

## 7. 비기능 요구사항

### 레이아웃
- 데스크톱 우선 1440px 기준 설계
- 1024px 이하에서 bento grid는 2열
- 768px 이하에서 3D 씬과 제어 패널은 1열 stack

### 브랜딩
- F1 = carbon / pitlane / telemetry
- NFT = iridescent / glass / holographic foil
- Blueprint = cyan line / drafting grid / engineering annotation

### 미학
- 실사보다 **기술 다이어그램과 쇼룸의 중간 지점**
- 과한 skeuomorphism 금지
- 깊이감은 `translateZ`, `box-shadow`, `ambient gradient`의 조합으로 만든다

---

## 8. 완료 정의(Definition of Done)

아래 항목을 모두 만족해야 “완료”다.

1. JS 파일이 프로젝트에 존재하지 않는다.
2. 모든 주요 상태 변경이 `input:checked` 또는 `:has()`로 설명 가능하다.
3. `view-story`, `view-knowledge`, `view-market` 세 화면이 동일 DOM 내부에서 전환된다.
4. Story 섹션에서 스크롤에 따라 최소 3개의 독립 애니메이션이 동작한다.
5. Knowledge 섹션에서 하나의 카드가 활성화되면 나머지 카드가 blur/dim 처리된다.
6. Market 섹션에서 색상/카메라/에디션 상태 변경 시 모델 또는 카드의 시각이 즉시 바뀐다.
7. 판매 CTA가 edition 상태와 동기화된다.
8. `prefers-reduced-motion: reduce` 대응이 존재한다.
9. DOM 구조가 `DOM_STRUCTURE.md`와 충돌하지 않는다.

---

## 9. 비범위(Out of Scope)
- 실제 온체인 mint 실행
- 실시간 wallet 상태 반영
- 다중 사용자 세션 동기화
- 서버 없는 상태 영속화
- 픽셀 단위 마우스 좌표 기반 3D orbit control
- 사용자 업로드 파일 처리

---

## 10. 최종 선언
이 프로젝트의 핵심은 “JS가 없는 사이트”가 아니라, **CSS를 상태 기계(state machine)로 쓰는 사이트**를 만드는 것이다.  
Velocity Vault는 장식적인 애니메이션 페이지가 아니라, 다음 규칙 위에 세워진다.

> 상태는 input이 가진다.  
> 전이는 label이 일으킨다.  
> 문맥은 `:has()`가 판별한다.  
> 시간축은 스크롤이 공급한다.  
> 깊이는 DOM과 transform이 만든다.
