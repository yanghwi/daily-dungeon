# Design Tokens

모든 CSS 파일 상단에 이 변수 블록을 포함하거나 공용 토큰 파일에서 import할 것.

```css
:root {
  /* Backgrounds */
  --bg-dark: #0d0221;
  --bg-mid: #1a0533;
  --ui-bg: #101028;

  /* Primary Accents */
  --pink: #e84393;
  --purple: #6c5ce7;
  --gold: #fdcb6e;

  /* Secondary */
  --lavender: #a29bfe;
  --orange: #e67e22;
  --green: #2ecc71;
  --green-dark: #1e6b35;
  --red: #e74c3c;
  --blue: #3498db;
  --cyan: #00cec9;

  /* UI Chrome */
  --ui-border: #f8f8f8;
  --ui-shadow: rgba(0, 0, 0, 0.5);

  /* Skin / NPC */
  --skin-light: #ffeaa7;
  --skin-mid: #f6e58d;
  --wood: #8e6630;
  --trunk: #5D4037;

  /* Metal (Starman 계열) */
  --metal-light: #dfe6e9;
  --metal-mid: #a4b0be;
  --metal-dark: #636e72;

  /* Pixel grid */
  --pixel: 4px;

  /* Typography */
  --font-title: 'Press Start 2P', monospace;
  --font-body: 'Silkscreen', monospace;
}
```

## Spacing Scale

픽셀 그리드 기반 간격. 모든 간격은 4px 배수를 사용한다.

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |

## Font Size Scale

| 용도 | Size | Font |
|------|------|------|
| 대제목 | 48px | `--font-title` |
| 섹션 제목 | 13px | `--font-title` |
| UI 레이블 | 10px | `--font-title` |
| 소형 텍스트 | 7-8px | `--font-title` |
| 본문 | 11-13px | `--font-body` |
