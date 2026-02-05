# UI Components — Earthbound Style

## Window Base (모든 UI 윈도우 공통)

```css
.eb-window {
  background: var(--ui-bg);
  border: 4px solid var(--ui-border);
  border-radius: 6px;
  padding: 16px 20px;
  box-shadow: 6px 6px 0 var(--ui-shadow);
  font-family: var(--font-title);
}
```

**변형:**
- 기본: `border-color: var(--ui-border)` — 대화창, 스탯, 메뉴
- 상점: `border-color: var(--gold)` + `box-shadow: 6px 6px 0 rgba(253,203,110,0.2)`
- 위험: `border-color: var(--red)` — 경고, 위험 상태

## Battle Menu

```
┌─────────────────┐
│ WHAT WILL YOU DO?│
│  ▶ BASH          │
│    PSI            │
│    GOODS          │
│    DEFEND         │
│    RUN AWAY       │
└─────────────────┘
```

- 선택 커서: 삼각형, `border-left: 8px solid var(--gold)`, `steps(1)` 깜빡임
- 항목: `font-size: 10px`, `padding: 8px 0 8px 24px`
- hover 시 `color: var(--gold)`

## Status Panel

```
┌──────────────┐
│ NESS         │
│ HP  234/342  │
│ ████████░░░  │
│ PP   56/120  │
│ ████░░░░░░░  │
│ LV  38       │
│ EXP 124580   │
└──────────────┘
```

HP Bar 구성:
```css
.hp-bar-bg {
  height: 8px;
  background: #2d3436;
  border: 1px solid #636e72;
}
.hp-bar-fill {
  height: 100%;
  transition: width 1s ease; /* 롤링 숫자 효과 모방 */
}
```

색상 임계값:
- 50% 이상: `var(--green)`
- 25-50%: `var(--gold)` + class `medium`
- 25% 미만: `var(--red)` + class `low` + 깜빡임 애니메이션

PP Bar: `background: var(--purple)`

## Dialogue Window

```
┌──────────────────────────────────┐
│ * PAULA                          │
│ The world is full of strange     │
│ things... ▼                      │
└──────────────────────────────────┘
```

- 화자 이름: `color: var(--cyan)`, 앞에 `*` 표시
- 본문: `font-size: 9px`, `line-height: 2.2`
- 하이라이트 색상: `.hl-pink`, `.hl-gold`, `.hl-green`
- 진행 커서: 45도 회전 삼각형, bounce 애니메이션

## Item/Inventory Window

- 아이템 아이콘: box-shadow 픽셀 아트 (3x3~4x4 그리드, scale(2))
- 목록: `border-bottom: 1px dashed rgba(255,255,255,0.1)`
- 수량: 우측 정렬, `color: var(--lavender)`

### 아이콘 제작 가이드

아이템 아이콘은 3x4 그리드(12x16px 단위), scale(2)로 표시.
```css
.icon-example {
  width: 4px; height: 4px;
  box-shadow:
    4px 0px 0 #color,
    0px 4px 0 #color, 4px 4px 0 #color, 8px 4px 0 #color,
    4px 8px 0 #color;
  transform: scale(2);
}
```

## Shop Window

- 테두리: `var(--gold)`
- 제목: 중앙 정렬
- 아이템: 이름 좌측, 가격(`var(--gold)`) 우측
- 설명: `font-size: 7px`, `color: var(--lavender)`
- 잔액: 하단 구분선 위, 우측 정렬

## Scanline Overlay

모든 씬/전투 화면에 적용:
```css
.scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px, transparent 3px,
    rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px
  );
  pointer-events: none;
  z-index: 50;
}
```

전투 씬에서는 opacity를 `0.15`로 높인다.
