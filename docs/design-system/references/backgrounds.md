# Battle Backgrounds — Layer Composition

Earthbound 전투 배경은 2-4개의 CSS 레이어를 중첩하여 사이키델릭 효과를 만든다.

## Layer Architecture

```
[최상위] Scanline overlay     — z: 50, pointer-events: none
[3층]    Pattern overlay      — 체커/줄무늬, opacity 0.03-0.1
[2층]    Secondary effect     — 보조 그라디언트, opacity 0.3-0.5
[1층]    Primary animation    — 핵심 효과, opacity 0.4-0.6
[바닥]   Base background      — var(--bg-dark) 단색
```

## Pattern Library

### 1. Swirl (소용돌이) — Magicant

```css
.swirl {
  position: absolute;
  inset: -50%;  /* 회전 시 모서리 빈 공간 방지 */
  background: repeating-conic-gradient(
    from 0deg at 50% 50%,
    var(--pink) 0deg 5deg,
    var(--bg-dark) 5deg 10deg,
    var(--purple) 10deg 15deg,
    var(--bg-dark) 15deg 20deg
  );
  animation: spin 12s linear infinite;
  opacity: 0.5;
}
```

핵심: `inset: -50%`로 요소를 컨테이너보다 크게 만들어 회전해도 빈 공간이 없게 함.

### 2. Distortion (왜곡 줄무늬) — Moonside

```css
.distort {
  background: repeating-linear-gradient(0deg,
    var(--red) 0px, var(--orange) 3px,
    var(--gold) 6px, var(--green) 9px,
    var(--cyan) 12px, var(--blue) 15px,
    var(--purple) 18px, var(--pink) 21px
  );
  background-size: 100% 42px;
  animation: scroll 2s linear infinite;
  opacity: 0.4;
}
```

### 3. Checker Rotation (체커보드 회전)

```css
.checker {
  inset: -200%;  /* 큰 회전 반경 */
  background: repeating-conic-gradient(
    var(--bg-dark) 0% 25%, transparent 0% 50%
  ) 0 0 / 20px 20px;
  animation: rotate 20s linear infinite;
  opacity: 0.3;
}
```

### 4. Diamond Grid (다이아몬드) — Giygas Domain

```css
.diamond {
  background:
    repeating-linear-gradient(45deg,
      transparent 0px, transparent 16px,
      rgba(232,67,147,0.3) 16px, rgba(232,67,147,0.3) 17px),
    repeating-linear-gradient(-45deg,
      transparent 0px, transparent 16px,
      rgba(108,92,231,0.3) 16px, rgba(108,92,231,0.3) 17px);
  animation: pulse 4s ease-in-out infinite;
}
```

### 5. Radial Glow

```css
.glow {
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(253,203,110,0.15),
    transparent 70%
  );
  animation: glowPulse 3s ease-in-out infinite;
}
```

## 조합 레시피

| 분위기 | Layer 1 | Layer 2 | Layer 3 |
|--------|---------|---------|---------|
| 몽환적 | Swirl(pink/purple) | Diamond | Glow(gold) |
| 위협적 | Distort(rainbow) | Checker | — |
| 최종보스 | Diamond(pulse) | Glow(red) | Swirl(slow) |
| 평화로운 | Glow(cyan) | — | — |

## Overworld (필드) 배경

필드 배경은 사이키델릭이 아닌 자연 경관:

```
[하늘]  linear-gradient(to bottom, #4a90d9, #87CEEB, #b8d4e8)
[구름]  border-radius 조합, cloudDrift 애니메이션
[나무]  radial-gradient 원형 + 사각형 기둥
[땅]    linear-gradient(to bottom, #4CAF50, #388E3C, #2E7D32)
[길]    repeating-linear-gradient(90deg, ...) 가로줄 패턴
```

구름은 `animation: cloudDrift Ns linear infinite`로 좌→우 이동.
각 구름에 다른 duration과 delay를 부여하여 자연스러운 흐름을 만든다.
