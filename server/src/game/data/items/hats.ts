import type { ItemDefinition } from '@round-midnight/shared';

export const HATS: ItemDefinition[] = [
  // ── common (3) ──
  {
    id: 'traffic_cone_hat',
    name: '삼각콘 투구',
    type: 'hat',
    rarity: 'common',
    description: '머리 위에 올리면 나름 투구 같다',
    flavorText: '공사장의 패션 아이콘.',
    effects: [{ type: 'stat_bonus', stat: 'armorBonus', value: 1 }],
    tags: ['defensive', 'head'],
    dropWeight: 13,
  },
  {
    id: 'thick_scarf',
    name: '방한 목출모',
    type: 'hat',
    rarity: 'common',
    description: '머리와 목을 감싸면 왠지 안심이 된다',
    flavorText: '할머니가 떠주신 목출모. 방탄은 아니지만.',
    effects: [{ type: 'stat_bonus', stat: 'armorBonus', value: 1 }],
    tags: ['defensive', 'warm', 'head'],
    dropWeight: 13,
  },
  {
    id: 'newspaper_hat',
    name: '신문지 모자',
    type: 'hat',
    rarity: 'common',
    description: '접어서 만든 클래식한 모자',
    flavorText: '오늘자 헤드라인을 머리에 이고 있다.',
    effects: [{ type: 'stat_bonus', stat: 'armorBonus', value: 1 }],
    tags: ['defensive', 'makeshift', 'head'],
    dropWeight: 14,
  },

  // ── uncommon (3) ──
  {
    id: 'bike_helmet',
    name: '자전거 헬멧',
    type: 'hat',
    rarity: 'uncommon',
    description: '머리를 확실히 보호한다',
    flavorText: '안전 인증 마크가 자신감을 준다.',
    effects: [{ type: 'stat_bonus', stat: 'armorBonus', value: 3 }],
    tags: ['defensive', 'head', 'certified'],
    dropWeight: 5,
  },
  {
    id: 'kendo_men',
    name: '검도 면',
    type: 'hat',
    rarity: 'uncommon',
    description: '정식 방어구. 머리를 든든하게 보호한다',
    flavorText: '세 판 승부의 흔적이 남아있다.',
    effects: [{ type: 'stat_bonus', stat: 'armorBonus', value: 3 }],
    tags: ['defensive', 'martial-arts', 'head'],
    dropWeight: 5,
  },
  {
    id: 'delivery_helmet',
    name: '배달 헬멧',
    type: 'hat',
    rarity: 'uncommon',
    description: '배달 라이더의 필수품을 개조했다',
    flavorText: '주문하신 방어력 배달왔습니다.',
    effects: [
      { type: 'stat_bonus', stat: 'armorBonus', value: 3 },
      { type: 'wave_heal', value: 2 },
    ],
    tags: ['defensive', 'delivery', 'head'],
    dropWeight: 5,
  },

  // ── rare (1) ──
  {
    id: 'hard_hat_gold',
    name: '금색 안전모',
    type: 'hat',
    rarity: 'rare',
    description: '현장 소장님만 쓸 수 있다는 전설의 모자',
    flavorText: '이 모자를 쓰면 모든 것이 안전해 보인다.',
    effects: [
      { type: 'stat_bonus', stat: 'armorBonus', value: 4 },
      { type: 'dc_reduction', category: 'all', value: 1 },
    ],
    tags: ['defensive', 'head', 'professional'],
    dropWeight: 2,
    waveMinimum: 4,
  },

  // ── legendary (1) ──
  {
    id: 'pixel_crown',
    name: '픽셀 왕관',
    type: 'hat',
    rarity: 'legendary',
    description: '8비트 세계의 왕관. 쓰면 왕이 된 기분',
    flavorText: '왕관은 무겁지만, 이건 4px이라 가볍다.',
    effects: [
      { type: 'stat_bonus', stat: 'armorBonus', value: 5 },
      { type: 'crit_expand', critMin: 3 },
    ],
    tags: ['defensive', 'retro', 'legendary', 'head'],
    dropWeight: 1,
    bossOnly: true,
    waveMinimum: 5,
  },
];
