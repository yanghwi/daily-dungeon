/** 해금 가능한 아이템 정의 */
export interface UnlockableDefinition {
  id: string;
  type: 'background' | 'cosmetic' | 'startItem';
  name: string;
  description: string;
  condition: UnlockCondition;
}

export type UnlockCondition =
  | { type: 'clears'; count: number }
  | { type: 'runs'; count: number }
  | { type: 'bossKill'; boss: string }
  | { type: 'noDamageBoss'; boss: string }
  | { type: 'dailyClears'; count: number };

export const UNLOCKABLES: UnlockableDefinition[] = [
  // 5회 클리어 → 새 배경
  {
    id: 'bg-wizard',
    type: 'background',
    name: '퇴직한 마법사',
    description: '마법은 잊었지만 잔꾀는 남아있다.',
    condition: { type: 'clears', count: 5 },
  },
  // 10회 클리어 → 특별 색상 팔레트
  {
    id: 'palette-neon',
    type: 'cosmetic',
    name: '네온 팔레트',
    description: '야시장의 네온사인을 닮은 색상.',
    condition: { type: 'clears', count: 10 },
  },
  // 최종보스 처치 → 시작 악세서리
  {
    id: 'start-midnight-shard',
    type: 'startItem',
    name: '자정의 파편',
    description: '자정의 시계에서 떨어진 조각. 미세한 시간 왜곡이 느껴진다.',
    condition: { type: 'bossKill', boss: 'midnight-clock' },
  },
  // 보스 무피해 처치 → 머리 파츠
  {
    id: 'head-crown',
    type: 'cosmetic',
    name: '왕관 머리',
    description: '진정한 영웅의 증거.',
    condition: { type: 'noDamageBoss', boss: 'midnight-clock' },
  },
  // 3회 런 참가 → 캐릭터 몸 파츠
  {
    id: 'body-armored',
    type: 'cosmetic',
    name: '갑옷 몸',
    description: '경험에서 얻은 단단함.',
    condition: { type: 'runs', count: 3 },
  },
  // 데일리 5회 클리어
  {
    id: 'palette-golden',
    type: 'cosmetic',
    name: '황금 팔레트',
    description: '매일 던전에 도전한 자의 보상.',
    condition: { type: 'dailyClears', count: 5 },
  },
];
