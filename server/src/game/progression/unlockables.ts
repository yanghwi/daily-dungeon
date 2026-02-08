import type { ItemEffect } from '@round-midnight/shared';

// ===== 보상 타입 =====

export type UnlockReward =
  | { type: 'passive_bonus'; effects: ItemEffect[] }
  | { type: 'title'; title: string }
  | { type: 'cosmetic' }
  | { type: 'start_item' };

// ===== 해금 조건 =====

export type UnlockCondition =
  | { type: 'clears'; count: number }
  | { type: 'runs'; count: number }
  | { type: 'bossKill'; boss: string }
  | { type: 'noDamageBoss'; boss: string }
  | { type: 'dailyClears'; count: number }
  | { type: 'wavesTotal'; count: number }
  | { type: 'level'; level: number };

// ===== 해금 정의 =====

export interface UnlockableDefinition {
  id: string;
  type: 'background' | 'cosmetic' | 'startItem' | 'passive' | 'title';
  name: string;
  description: string;
  condition: UnlockCondition;
  reward?: UnlockReward;
}

export const UNLOCKABLES: UnlockableDefinition[] = [
  // ===== 기존 6종 =====

  {
    id: 'bg-wizard',
    type: 'background',
    name: '퇴직한 마법사',
    description: '마법은 잊었지만 잔꾀는 남아있다.',
    condition: { type: 'clears', count: 5 },
  },
  {
    id: 'palette-neon',
    type: 'cosmetic',
    name: '네온 팔레트',
    description: '야시장의 네온사인을 닮은 색상.',
    condition: { type: 'clears', count: 10 },
  },
  {
    id: 'start-midnight-shard',
    type: 'startItem',
    name: '자정의 파편',
    description: '자정의 시계에서 떨어진 조각. 미세한 시간 왜곡이 느껴진다.',
    condition: { type: 'bossKill', boss: 'midnight-clock' },
  },
  {
    id: 'head-crown',
    type: 'cosmetic',
    name: '왕관 머리',
    description: '진정한 영웅의 증거.',
    condition: { type: 'noDamageBoss', boss: 'midnight-clock' },
  },
  {
    id: 'body-armored',
    type: 'cosmetic',
    name: '갑옷 몸',
    description: '경험에서 얻은 단단함.',
    condition: { type: 'runs', count: 3 },
  },
  {
    id: 'palette-golden',
    type: 'cosmetic',
    name: '황금 팔레트',
    description: '매일 던전에 도전한 자의 보상.',
    condition: { type: 'dailyClears', count: 5 },
  },

  // ===== 신규 8종 =====

  // 패시브: 누적 웨이브 50 → wave_heal +3
  {
    id: 'passive-wave-heal',
    type: 'passive',
    name: '전장의 회복력',
    description: '매 웨이브마다 HP가 조금씩 회복된다.',
    condition: { type: 'wavesTotal', count: 50 },
    reward: { type: 'passive_bonus', effects: [{ type: 'wave_heal', value: 3 }] },
  },
  // 패시브: 15회 클리어 → reroll +1
  {
    id: 'passive-reroll',
    type: 'passive',
    name: '운명의 재도전',
    description: '주사위를 한 번 더 굴릴 수 있다.',
    condition: { type: 'clears', count: 15 },
    reward: { type: 'passive_bonus', effects: [{ type: 'reroll', count: 1 }] },
  },
  // 패시브: 레벨 8 → min_raise 3
  {
    id: 'passive-min-raise',
    type: 'passive',
    name: '숙련자의 감각',
    description: '주사위의 최솟값이 보장된다.',
    condition: { type: 'level', level: 8 },
    reward: { type: 'passive_bonus', effects: [{ type: 'min_raise', minValue: 3 }] },
  },
  // 패시브: 25회 클리어 → dc_reduction(all) 1
  {
    id: 'passive-dc-all',
    type: 'passive',
    name: '달인의 여유',
    description: '모든 행동의 난이도가 살짝 낮아진다.',
    condition: { type: 'clears', count: 25 },
    reward: { type: 'passive_bonus', effects: [{ type: 'dc_reduction', category: 'all', value: 1 }] },
  },
  // 칭호: 50회 런 → "베테랑"
  {
    id: 'title-veteran',
    type: 'title',
    name: '베테랑',
    description: '50번의 던전을 경험한 노련함.',
    condition: { type: 'runs', count: 50 },
    reward: { type: 'title', title: '베테랑' },
  },
  // 칭호: 데일리 10회 클리어 → "데일리 킹"
  {
    id: 'title-daily-king',
    type: 'title',
    name: '데일리 킹',
    description: '매일매일 던전을 정복하는 자.',
    condition: { type: 'dailyClears', count: 10 },
    reward: { type: 'title', title: '데일리 킹' },
  },
  // 배경: 레벨 5 → "은퇴한 해커"
  {
    id: 'bg-hacker',
    type: 'background',
    name: '은퇴한 해커',
    description: '키보드를 내려놓았지만, 코드는 아직 기억한다.',
    condition: { type: 'level', level: 5 },
  },
  // 코스메틱: 레벨 10 → 자정 팔레트
  {
    id: 'palette-midnight',
    type: 'cosmetic',
    name: '자정 팔레트',
    description: '자정의 어둠 속에서 빛나는 색상.',
    condition: { type: 'level', level: 10 },
  },
];
