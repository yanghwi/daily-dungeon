# STYLE-GUIDE.md — Mother/Earthbound Design System

## Aesthetic Direction

Mother 시리즈(특히 Earthbound/Mother 2)의 16-bit 비주얼을 현대 웹 기술로 재현한다.
핵심 키워드: **사이키델릭, 따뜻함, 픽셀, 기묘함, 유머**

## Color Tokens

모든 색상은 CSS 변수로 참조한다. 정의: `references/tokens.md`

| 용도 | 변수 | 값 |
|------|------|----|
| 배경(어둠) | `--bg-dark` | `#0d0221` |
| 배경(중간) | `--bg-mid` | `#1a0533` |
| 강조(핑크) | `--pink` | `#e84393` |
| 강조(보라) | `--purple` | `#6c5ce7` |
| 라벤더 | `--lavender` | `#a29bfe` |
| 골드 | `--gold` | `#fdcb6e` |
| 오렌지 | `--orange` | `#e67e22` |
| 그린 | `--green` | `#2ecc71` |
| 레드 | `--red` | `#e74c3c` |
| 블루 | `--blue` | `#3498db` |
| 시안 | `--cyan` | `#00cec9` |
| UI 테두리 | `--ui-border` | `#f8f8f8` |
| UI 배경 | `--ui-bg` | `#101028` |

## Typography

- **제목**: `'Press Start 2P'` (Google Fonts)
- **본문**: `'Silkscreen'` (Google Fonts)
- 일반 시스템 폰트 사용 금지.

## Core Techniques

### 1. Box-Shadow Pixel Art
모든 스프라이트는 `box-shadow`로 구현한다.
- 기본 단위: 4x4px
- 루트 요소: `width: 4px; height: 4px; background: transparent;`
- `transform: scale(N)`으로 크기 조절
- 상세 기법: `references/pixel-art.md`

### 2. Animation Principles
- 캐릭터 idle: `steps(2)` 또는 `steps(3)` — 프레임 제한으로 레트로 느낌
- 유령/부유: `ease-in-out` — 부드러운 떠다님
- UI 커서: `steps(1)` — 깜빡임
- 배경: `linear` — 끊김 없는 회전/스크롤
- 체력 위험: `steps(1)` 깜빡임 + 색상 교대

### 3. Background Patterns
사이키델릭 배경은 레이어 조합으로 구현한다:
1. `repeating-conic-gradient` — 소용돌이
2. `repeating-linear-gradient` — 줄무늬/체커
3. `radial-gradient` — 글로우
4. 스캔라인 오버레이 (3px 투명 + 1px 반투명 반복)
- 상세: `references/backgrounds.md`

### 4. UI Windows
Earthbound 윈도우 스타일:
- `background: var(--ui-bg)`
- `border: 4px solid var(--ui-border)`
- `border-radius: 6px`
- `box-shadow: 6px 6px 0 rgba(0,0,0,0.5)`
- 상세: `references/ui-components.md`

## File Naming

| 유형 | 패턴 | 예시 |
|------|------|------|
| 몬스터 | `monster-{name}.css` | `monster-starman.css` |
| 배경 | `bg-{name}.css` | `bg-magicant.css` |
| UI | `ui-{name}.css` | `ui-battle-menu.css` |
| 씬 | `scene-{name}.html` | `scene-overworld.html` |
