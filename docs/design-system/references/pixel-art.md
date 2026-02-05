# Pixel Art — Box-Shadow Technique

## 기본 구조

모든 스프라이트의 기본 골격:

```css
.sprite {
  width: 4px;
  height: 4px;
  background: transparent;
  image-rendering: pixelated;
  transform: scale(3);        /* 배율 조정 */
  box-shadow:
    /* X Y 0 COLOR 형식으로 픽셀 배치 */
    4px  0px 0 #color,
    8px  0px 0 #color,
    4px  4px 0 #color;
}
```

**규칙:**
- blur 값은 항상 `0` (선명한 픽셀)
- 좌표는 4px 배수 그리드
- 원점(0,0)은 좌상단
- scale로 최종 크기 조절 (원본은 항상 4px 단위)

## 좌표 그리드 예시 (8x8 스프라이트)

```
       0   4   8  12  16  20  24  28
  0  [ ][ ][ ][ ][ ][ ][ ][ ]
  4  [ ][ ][ ][ ][ ][ ][ ][ ]
  8  [ ][ ][ ][ ][ ][ ][ ][ ]
 12  [ ][ ][ ][ ][ ][ ][ ][ ]
 16  [ ][ ][ ][ ][ ][ ][ ][ ]
 20  [ ][ ][ ][ ][ ][ ][ ][ ]
 24  [ ][ ][ ][ ][ ][ ][ ][ ]
 28  [ ][ ][ ][ ][ ][ ][ ][ ]
```

## 컬러 구성 원칙

Earthbound 스프라이트는 보통 4-6색으로 구성된다:

| 역할 | 설명 |
|------|------|
| Base | 주 색상 (몸통) |
| Shade | Base보다 어두운 음영 |
| Highlight | Base보다 밝은 하이라이트 |
| Eye | 눈 색상 (보통 `#2d3436`) |
| Accent | 특징적 포인트 색상 |

## 애니메이션 패턴

### Idle 바운스 (기본)
```css
@keyframes idle {
  0%, 100% { transform: scale(3) translateY(0); }
  50%      { transform: scale(3) translateY(-2px); }
}
animation: idle 1s steps(2) infinite;
```

### 좌우 흔들림
```css
@keyframes wobble {
  0%  { transform: scale(3) rotate(-3deg); }
  50% { transform: scale(3) rotate(3deg); }
}
animation: wobble 1s steps(2) infinite;
```

### 부유 (유령형)
```css
@keyframes float {
  0%, 100% { transform: scale(3) translateY(0) rotate(0deg); }
  25%      { transform: scale(3) translateY(-4px) rotate(-2deg); }
  75%      { transform: scale(3) translateY(-2px) rotate(2deg); }
}
animation: float 2s ease-in-out infinite;
```

### 맥동 (아메바형)
```css
@keyframes pulse {
  0%  { transform: scale(3) scaleX(1); }
  50% { transform: scale(3) scaleX(1.05); }
}
animation: pulse 0.8s steps(2) infinite;
```

## 기존 몬스터 참조

구현 완료된 몬스터 스프라이트는 `assets/earthbound-assets.html`에서 확인할 것.
제공된 몬스터: Starman Jr., Abstract Art, Ramblin' Shroom, Wistful Spirit, Mr. Doturn

새 몬스터를 만들 때 기존 스프라이트의 box-shadow 패턴을 참고하여
일관된 해상도(8-10 pixel 너비)와 색상 조합을 유지한다.

## 캐릭터 스프라이트 (오버월드)

오버월드 캐릭터는 약 6x8 그리드(24x32px 단위):
- 2행: 모자/머리카락
- 2행: 얼굴 (눈)
- 2행: 몸통 (옷)
- 2행: 다리/발

걷기 애니메이션은 `charBob` 패턴 사용.
