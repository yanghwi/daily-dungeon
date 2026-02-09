import type { ItemDefinition } from '@round-midnight/shared';

export const BOTTOMS: ItemDefinition[] = [
  // ── common (3) ──
  {
    id: 'rubber_boots',
    name: '고무 장화',
    type: 'bottom',
    rarity: 'common',
    description: '발을 보호하고 물도 안 새요',
    flavorText: '비 오는 날의 필수품. 전투에선 글쎄.',
    effects: [{ type: 'stat_bonus', stat: 'armorBonus', value: 1 }],
    tags: ['defensive', 'waterproof'],
    dropWeight: 14,
  },
  {
    id: 'sports_pad',
    name: '스포츠 보호대',
    type: 'bottom',
    rarity: 'common',
    description: '무릎과 팔꿈치를 보호한다',
    flavorText: '인라인 스케이트용이었지만 용도 변경.',
    effects: [{ type: 'stat_bonus', stat: 'armorBonus', value: 2 }],
    tags: ['defensive', 'sports'],
    dropWeight: 10,
  },
  {
    id: 'cargo_pants',
    name: '카고 바지',
    type: 'bottom',
    rarity: 'common',
    description: '주머니가 여덟 개나 있다',
    flavorText: '주머니마다 뭔가 들어있을 것 같은 느낌.',
    effects: [{ type: 'stat_bonus', stat: 'armorBonus', value: 1 }],
    tags: ['defensive', 'pockets'],
    dropWeight: 14,
  },

  // ── uncommon (2) ──
  {
    id: 'tactical_pants',
    name: '택티컬 팬츠',
    type: 'bottom',
    rarity: 'uncommon',
    description: '주머니가 엄청 많다. 뭐든 넣을 수 있다',
    flavorText: '주머니 수와 방어력은 비례한다. 아마도.',
    effects: [
      { type: 'stat_bonus', stat: 'armorBonus', value: 2 },
      { type: 'dc_reduction', category: 'physical', value: 1 },
    ],
    tags: ['defensive', 'tactical', 'pockets'],
    dropWeight: 6,
  },
  {
    id: 'padded_joggers',
    name: '기모 조거팬츠',
    type: 'bottom',
    rarity: 'uncommon',
    description: '따뜻하고 움직이기 편하다',
    flavorText: '편의점 갈 때 신던 바지가 전투복이 되었다.',
    effects: [
      { type: 'stat_bonus', stat: 'armorBonus', value: 2 },
      { type: 'wave_heal', value: 1 },
    ],
    tags: ['defensive', 'comfortable'],
    dropWeight: 6,
  },

  // ── rare (2) ──
  {
    id: 'mascot_pants',
    name: '마스코트 바지',
    type: 'bottom',
    rarity: 'rare',
    description: '푹신하고 귀엽고 의외로 튼튼하다',
    flavorText: '적도 때리기가 망설여지는 귀여움.',
    effects: [
      { type: 'stat_bonus', stat: 'armorBonus', value: 3 },
      { type: 'dc_reduction', category: 'social', value: 2 },
      { type: 'wave_heal', value: 2 },
    ],
    tags: ['defensive', 'cute', 'social'],
    dropWeight: 3,
    waveMinimum: 3,
  },
  {
    id: 'reinforced_jeans',
    name: '강화 청바지',
    type: 'bottom',
    rarity: 'rare',
    description: '케블라 섬유를 박아넣은 청바지',
    flavorText: '패션과 방어의 경계를 허물다.',
    effects: [
      { type: 'stat_bonus', stat: 'armorBonus', value: 4 },
      { type: 'dc_reduction', category: 'physical', value: 1 },
    ],
    tags: ['defensive', 'tactical'],
    dropWeight: 2,
    waveMinimum: 4,
  },

  // ── legendary (1) ──
  {
    id: 'pixel_greaves',
    name: '픽셀 각반',
    type: 'bottom',
    rarity: 'legendary',
    description: '8비트 세계에서 건너온 각반',
    flavorText: '해상도는 낮지만 방어력은 최고.',
    effects: [
      { type: 'stat_bonus', stat: 'armorBonus', value: 6 },
      { type: 'damage_multiplier', multiplier: 0.7 },
    ],
    tags: ['defensive', 'retro', 'legendary'],
    dropWeight: 1,
    bossOnly: true,
    waveMinimum: 5,
  },
];
