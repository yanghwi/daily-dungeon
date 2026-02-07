/**
 * 캐릭터 픽셀아트 파츠 시스템
 * 4px 그리드 box-shadow 기반
 * 머리(head) + 몸(body) + 색상 팔레트(palette)로 조합
 */

export interface CharacterPalette {
  id: string;
  name: string;
  skin: string;     // 피부색
  hair: string;     // 머리카락
  shirt: string;    // 상의 메인
  accent: string;   // 포인트 색상
  pants: string;    // 하의
  shoes: string;    // 신발
}

export interface CharacterPart {
  id: string;
  name: string;
  /** 4px 그리드 좌표 배열 — [{x, y, colorKey}] */
  pixels: { x: number; y: number; colorKey: keyof CharacterPalette }[];
}

export interface CharacterAppearance {
  headId: string;
  bodyId: string;
  paletteId: string;
}

// ─── 색상 팔레트 ───

export const PALETTES: CharacterPalette[] = [
  {
    id: 'default',
    name: '기본',
    skin: '#f5cba7', hair: '#2d3436', shirt: '#3498db', accent: '#2980b9',
    pants: '#2c3e50', shoes: '#1a1a2e',
  },
  {
    id: 'warm',
    name: '따뜻한',
    skin: '#f5cba7', hair: '#a0522d', shirt: '#e74c3c', accent: '#c0392b',
    pants: '#34495e', shoes: '#2c3e50',
  },
  {
    id: 'cool',
    name: '차가운',
    skin: '#dfe6e9', hair: '#636e72', shirt: '#6c5ce7', accent: '#a29bfe',
    pants: '#2d3436', shoes: '#1a1a2e',
  },
  {
    id: 'nature',
    name: '자연',
    skin: '#f5cba7', hair: '#27ae60', shirt: '#2ecc71', accent: '#1abc9c',
    pants: '#795548', shoes: '#5d4037',
  },
  {
    id: 'midnight',
    name: '자정',
    skin: '#b2bec3', hair: '#6c5ce7', shirt: '#2d3436', accent: '#a29bfe',
    pants: '#1a1a2e', shoes: '#0a0a1a',
  },
];

// ─── 머리 파츠 ───

export const HEADS: CharacterPart[] = [
  {
    id: 'round',
    name: '둥근 머리',
    pixels: [
      // 머리카락 (윗줄)
      { x: 4, y: 0, colorKey: 'hair' }, { x: 8, y: 0, colorKey: 'hair' }, { x: 12, y: 0, colorKey: 'hair' },
      // 머리카락 + 이마
      { x: 0, y: 4, colorKey: 'hair' }, { x: 4, y: 4, colorKey: 'skin' }, { x: 8, y: 4, colorKey: 'skin' }, { x: 12, y: 4, colorKey: 'skin' }, { x: 16, y: 4, colorKey: 'hair' },
      // 눈
      { x: 0, y: 8, colorKey: 'skin' }, { x: 4, y: 8, colorKey: 'shoes' }, { x: 8, y: 8, colorKey: 'skin' }, { x: 12, y: 8, colorKey: 'shoes' }, { x: 16, y: 8, colorKey: 'skin' },
      // 입
      { x: 4, y: 12, colorKey: 'skin' }, { x: 8, y: 12, colorKey: 'accent' }, { x: 12, y: 12, colorKey: 'skin' },
    ],
  },
  {
    id: 'spiky',
    name: '뾰족 머리',
    pixels: [
      // 뾰족 머리카락
      { x: 4, y: -4, colorKey: 'hair' }, { x: 12, y: -4, colorKey: 'hair' },
      { x: 0, y: 0, colorKey: 'hair' }, { x: 4, y: 0, colorKey: 'hair' }, { x: 8, y: 0, colorKey: 'hair' }, { x: 12, y: 0, colorKey: 'hair' }, { x: 16, y: 0, colorKey: 'hair' },
      // 이마
      { x: 0, y: 4, colorKey: 'hair' }, { x: 4, y: 4, colorKey: 'skin' }, { x: 8, y: 4, colorKey: 'skin' }, { x: 12, y: 4, colorKey: 'skin' }, { x: 16, y: 4, colorKey: 'hair' },
      // 눈
      { x: 0, y: 8, colorKey: 'skin' }, { x: 4, y: 8, colorKey: 'shoes' }, { x: 8, y: 8, colorKey: 'skin' }, { x: 12, y: 8, colorKey: 'shoes' }, { x: 16, y: 8, colorKey: 'skin' },
      // 입
      { x: 4, y: 12, colorKey: 'skin' }, { x: 8, y: 12, colorKey: 'accent' }, { x: 12, y: 12, colorKey: 'skin' },
    ],
  },
  {
    id: 'cap',
    name: '모자',
    pixels: [
      // 모자
      { x: 0, y: -4, colorKey: 'accent' }, { x: 4, y: -4, colorKey: 'accent' }, { x: 8, y: -4, colorKey: 'accent' }, { x: 12, y: -4, colorKey: 'accent' }, { x: 16, y: -4, colorKey: 'accent' }, { x: 20, y: -4, colorKey: 'accent' },
      { x: 0, y: 0, colorKey: 'accent' }, { x: 4, y: 0, colorKey: 'shirt' }, { x: 8, y: 0, colorKey: 'shirt' }, { x: 12, y: 0, colorKey: 'shirt' }, { x: 16, y: 0, colorKey: 'accent' },
      // 이마
      { x: 0, y: 4, colorKey: 'skin' }, { x: 4, y: 4, colorKey: 'skin' }, { x: 8, y: 4, colorKey: 'skin' }, { x: 12, y: 4, colorKey: 'skin' }, { x: 16, y: 4, colorKey: 'skin' },
      // 눈
      { x: 0, y: 8, colorKey: 'skin' }, { x: 4, y: 8, colorKey: 'shoes' }, { x: 8, y: 8, colorKey: 'skin' }, { x: 12, y: 8, colorKey: 'shoes' }, { x: 16, y: 8, colorKey: 'skin' },
      // 입
      { x: 4, y: 12, colorKey: 'skin' }, { x: 8, y: 12, colorKey: 'accent' }, { x: 12, y: 12, colorKey: 'skin' },
    ],
  },
  {
    id: 'long',
    name: '긴 머리',
    pixels: [
      // 머리카락
      { x: 4, y: 0, colorKey: 'hair' }, { x: 8, y: 0, colorKey: 'hair' }, { x: 12, y: 0, colorKey: 'hair' },
      { x: 0, y: 4, colorKey: 'hair' }, { x: 4, y: 4, colorKey: 'skin' }, { x: 8, y: 4, colorKey: 'skin' }, { x: 12, y: 4, colorKey: 'skin' }, { x: 16, y: 4, colorKey: 'hair' },
      // 눈 + 옆머리
      { x: -4, y: 8, colorKey: 'hair' }, { x: 0, y: 8, colorKey: 'skin' }, { x: 4, y: 8, colorKey: 'shoes' }, { x: 8, y: 8, colorKey: 'skin' }, { x: 12, y: 8, colorKey: 'shoes' }, { x: 16, y: 8, colorKey: 'skin' }, { x: 20, y: 8, colorKey: 'hair' },
      // 입 + 옆머리
      { x: -4, y: 12, colorKey: 'hair' }, { x: 4, y: 12, colorKey: 'skin' }, { x: 8, y: 12, colorKey: 'accent' }, { x: 12, y: 12, colorKey: 'skin' }, { x: 20, y: 12, colorKey: 'hair' },
      // 긴 머리카락 늘어짐
      { x: -4, y: 16, colorKey: 'hair' }, { x: 20, y: 16, colorKey: 'hair' },
    ],
  },
];

// ─── 몸 파츠 ───

export const BODIES: CharacterPart[] = [
  {
    id: 'normal',
    name: '기본',
    pixels: [
      // 목
      { x: 8, y: 0, colorKey: 'skin' },
      // 상체
      { x: 0, y: 4, colorKey: 'shirt' }, { x: 4, y: 4, colorKey: 'shirt' }, { x: 8, y: 4, colorKey: 'shirt' }, { x: 12, y: 4, colorKey: 'shirt' }, { x: 16, y: 4, colorKey: 'shirt' },
      { x: 0, y: 8, colorKey: 'shirt' }, { x: 4, y: 8, colorKey: 'shirt' }, { x: 8, y: 8, colorKey: 'accent' }, { x: 12, y: 8, colorKey: 'shirt' }, { x: 16, y: 8, colorKey: 'shirt' },
      // 팔 + 하체
      { x: -4, y: 4, colorKey: 'skin' }, { x: 20, y: 4, colorKey: 'skin' },
      { x: 4, y: 12, colorKey: 'pants' }, { x: 8, y: 12, colorKey: 'pants' }, { x: 12, y: 12, colorKey: 'pants' },
      // 다리
      { x: 4, y: 16, colorKey: 'pants' }, { x: 12, y: 16, colorKey: 'pants' },
      // 신발
      { x: 4, y: 20, colorKey: 'shoes' }, { x: 12, y: 20, colorKey: 'shoes' },
    ],
  },
  {
    id: 'bulky',
    name: '건장한',
    pixels: [
      // 목
      { x: 8, y: 0, colorKey: 'skin' },
      // 넓은 상체
      { x: -4, y: 4, colorKey: 'shirt' }, { x: 0, y: 4, colorKey: 'shirt' }, { x: 4, y: 4, colorKey: 'shirt' }, { x: 8, y: 4, colorKey: 'shirt' }, { x: 12, y: 4, colorKey: 'shirt' }, { x: 16, y: 4, colorKey: 'shirt' }, { x: 20, y: 4, colorKey: 'shirt' },
      { x: -4, y: 8, colorKey: 'shirt' }, { x: 0, y: 8, colorKey: 'shirt' }, { x: 4, y: 8, colorKey: 'accent' }, { x: 8, y: 8, colorKey: 'accent' }, { x: 12, y: 8, colorKey: 'accent' }, { x: 16, y: 8, colorKey: 'shirt' }, { x: 20, y: 8, colorKey: 'shirt' },
      // 팔
      { x: -8, y: 4, colorKey: 'skin' }, { x: 24, y: 4, colorKey: 'skin' },
      { x: -8, y: 8, colorKey: 'skin' }, { x: 24, y: 8, colorKey: 'skin' },
      // 하체
      { x: 0, y: 12, colorKey: 'pants' }, { x: 4, y: 12, colorKey: 'pants' }, { x: 8, y: 12, colorKey: 'pants' }, { x: 12, y: 12, colorKey: 'pants' }, { x: 16, y: 12, colorKey: 'pants' },
      // 다리
      { x: 4, y: 16, colorKey: 'pants' }, { x: 12, y: 16, colorKey: 'pants' },
      { x: 4, y: 20, colorKey: 'shoes' }, { x: 12, y: 20, colorKey: 'shoes' },
    ],
  },
  {
    id: 'slim',
    name: '날씬한',
    pixels: [
      // 목
      { x: 8, y: 0, colorKey: 'skin' },
      // 가는 상체
      { x: 4, y: 4, colorKey: 'shirt' }, { x: 8, y: 4, colorKey: 'shirt' }, { x: 12, y: 4, colorKey: 'shirt' },
      { x: 4, y: 8, colorKey: 'shirt' }, { x: 8, y: 8, colorKey: 'accent' }, { x: 12, y: 8, colorKey: 'shirt' },
      // 팔
      { x: 0, y: 4, colorKey: 'skin' }, { x: 16, y: 4, colorKey: 'skin' },
      // 하체
      { x: 4, y: 12, colorKey: 'pants' }, { x: 8, y: 12, colorKey: 'pants' }, { x: 12, y: 12, colorKey: 'pants' },
      // 가는 다리
      { x: 4, y: 16, colorKey: 'pants' }, { x: 12, y: 16, colorKey: 'pants' },
      { x: 4, y: 20, colorKey: 'shoes' }, { x: 12, y: 20, colorKey: 'shoes' },
    ],
  },
];

// ─── 렌더링 유틸 ───

/** 캐릭터 파츠 조합 → box-shadow 문자열 생성 */
export function buildCharacterSprite(appearance: CharacterAppearance): string {
  const palette = PALETTES.find((p) => p.id === appearance.paletteId) ?? PALETTES[0];
  const head = HEADS.find((h) => h.id === appearance.headId) ?? HEADS[0];
  const body = BODIES.find((b) => b.id === appearance.bodyId) ?? BODIES[0];

  const headOffset = 0;   // 머리 시작 y
  const bodyOffset = 16;  // 몸 시작 y (머리 아래)

  const shadows: string[] = [];

  for (const p of head.pixels) {
    const color = palette[p.colorKey];
    shadows.push(`${p.x}px ${p.y + headOffset}px 0 ${color}`);
  }

  for (const p of body.pixels) {
    const color = palette[p.colorKey];
    shadows.push(`${p.x}px ${p.y + bodyOffset}px 0 ${color}`);
  }

  return shadows.join(', ');
}

export const DEFAULT_APPEARANCE: CharacterAppearance = {
  headId: 'round',
  bodyId: 'normal',
  paletteId: 'default',
};
