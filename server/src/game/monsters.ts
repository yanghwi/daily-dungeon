import { v4 as uuidv4 } from 'uuid';
import type { Monster, MapType, Item, ItemRarity } from '@daily-dungeon/shared';

// 맵 타입별 몬스터 템플릿
interface MonsterTemplate {
  name: string;
  combatPower: number;
  description: string;
  dropChance: number; // 0-1
  possibleDrops: { name: string; rarity: ItemRarity; combatPower: number }[];
}

export const MONSTER_TEMPLATES: Record<MapType, MonsterTemplate[]> = {
  goblin_cave: [
    {
      name: '고블린',
      combatPower: 15,
      description: '녹색 피부에 날카로운 이빨을 가진 작은 생명체',
      dropChance: 0.3,
      possibleDrops: [
        { name: '녹슨 단검', rarity: 'common', combatPower: 5 },
        { name: '고블린 귀걸이', rarity: 'common', combatPower: 3 },
      ],
    },
    {
      name: '고블린 전사',
      combatPower: 25,
      description: '조잡한 갑옷을 두른 고블린, 동족보다 강하다',
      dropChance: 0.4,
      possibleDrops: [
        { name: '고블린 도끼', rarity: 'uncommon', combatPower: 10 },
        { name: '가죽 조끼', rarity: 'common', combatPower: 5 },
      ],
    },
    {
      name: '고블린 주술사',
      combatPower: 35,
      description: '기이한 주문을 외우는 고블린, 위험하다',
      dropChance: 0.5,
      possibleDrops: [
        { name: '마력의 지팡이', rarity: 'uncommon', combatPower: 12 },
        { name: '주술 부적', rarity: 'rare', combatPower: 15 },
      ],
    },
  ],
  abandoned_mine: [
    {
      name: '광산 쥐',
      combatPower: 20,
      description: '어둠 속에서 자란 거대한 쥐',
      dropChance: 0.25,
      possibleDrops: [
        { name: '쥐 이빨', rarity: 'common', combatPower: 3 },
      ],
    },
    {
      name: '무너진 광부',
      combatPower: 40,
      description: '광산에서 목숨을 잃은 광부의 망령',
      dropChance: 0.45,
      possibleDrops: [
        { name: '광부의 곡괭이', rarity: 'uncommon', combatPower: 12 },
        { name: '헤드랜턴', rarity: 'uncommon', combatPower: 8 },
      ],
    },
    {
      name: '동굴 트롤',
      combatPower: 60,
      description: '광산 깊은 곳에 서식하는 거대한 트롤',
      dropChance: 0.6,
      possibleDrops: [
        { name: '트롤 가죽', rarity: 'rare', combatPower: 18 },
        { name: '재생의 반지', rarity: 'rare', combatPower: 20 },
      ],
    },
  ],
  ancient_temple: [
    {
      name: '석상 병사',
      combatPower: 45,
      description: '고대 신전을 지키는 돌로 만든 병사',
      dropChance: 0.35,
      possibleDrops: [
        { name: '고대 검', rarity: 'uncommon', combatPower: 14 },
        { name: '석재 방패', rarity: 'uncommon', combatPower: 10 },
      ],
    },
    {
      name: '신전 수호자',
      combatPower: 70,
      description: '신전의 비밀을 지키는 신비로운 존재',
      dropChance: 0.55,
      possibleDrops: [
        { name: '수호자의 창', rarity: 'rare', combatPower: 22 },
        { name: '축복받은 갑옷', rarity: 'rare', combatPower: 18 },
      ],
    },
    {
      name: '타락한 사제',
      combatPower: 90,
      description: '어둠에 물든 고대 사제, 강력한 저주를 사용한다',
      dropChance: 0.7,
      possibleDrops: [
        { name: '저주받은 홀', rarity: 'rare', combatPower: 25 },
        { name: '사제의 로브', rarity: 'legendary', combatPower: 30 },
      ],
    },
  ],
  abyss: [
    {
      name: '심연의 그림자',
      combatPower: 80,
      description: '형체 없는 어둠의 존재',
      dropChance: 0.45,
      possibleDrops: [
        { name: '그림자 단검', rarity: 'rare', combatPower: 20 },
        { name: '암흑의 망토', rarity: 'rare', combatPower: 22 },
      ],
    },
    {
      name: '심연 파수꾼',
      combatPower: 110,
      description: '심연의 깊은 곳을 지키는 거대한 괴물',
      dropChance: 0.6,
      possibleDrops: [
        { name: '심연의 대검', rarity: 'legendary', combatPower: 35 },
        { name: '파수꾼의 갑주', rarity: 'legendary', combatPower: 30 },
      ],
    },
    {
      name: '고대 악마',
      combatPower: 150,
      description: '봉인에서 풀려난 고대의 악마, 극도로 위험하다',
      dropChance: 0.8,
      possibleDrops: [
        { name: '악마의 왕관', rarity: 'legendary', combatPower: 40 },
        { name: '영혼 파괴자', rarity: 'legendary', combatPower: 45 },
      ],
    },
  ],
};

// 몬스터 생성
export function createMonster(mapType: MapType): Monster {
  const templates = MONSTER_TEMPLATES[mapType];
  const template = templates[Math.floor(Math.random() * templates.length)];

  return {
    id: uuidv4(),
    name: template.name,
    combatPower: template.combatPower,
    description: template.description,
  };
}

// 몬스터 드랍 아이템 생성
export function generateMonsterDrop(mapType: MapType, monsterName: string): Item | null {
  const templates = MONSTER_TEMPLATES[mapType];
  const template = templates.find((t) => t.name === monsterName);

  if (!template) return null;

  // 드랍 확률 체크
  if (Math.random() > template.dropChance) return null;

  // 랜덤 아이템 선택
  const dropInfo = template.possibleDrops[Math.floor(Math.random() * template.possibleDrops.length)];

  return {
    id: uuidv4(),
    name: dropInfo.name,
    type: dropInfo.name.includes('검') || dropInfo.name.includes('단검') || dropInfo.name.includes('창') || dropInfo.name.includes('도끼') || dropInfo.name.includes('곡괭이') || dropInfo.name.includes('지팡이') || dropInfo.name.includes('홀')
      ? 'weapon'
      : dropInfo.name.includes('갑옷') || dropInfo.name.includes('조끼') || dropInfo.name.includes('망토') || dropInfo.name.includes('로브') || dropInfo.name.includes('갑주') || dropInfo.name.includes('방패') || dropInfo.name.includes('가죽')
        ? 'armor'
        : 'accessory',
    rarity: dropInfo.rarity,
    combatPower: dropInfo.combatPower,
    description: `${monsterName}에게서 얻은 ${dropInfo.name}`,
  };
}

// 특정 맵 타입의 난이도에 맞는 몬스터 선택
export function selectMonsterForDifficulty(mapType: MapType, difficultyBias: number = 0.5): Monster {
  const templates = MONSTER_TEMPLATES[mapType];

  // difficultyBias가 높을수록 강한 몬스터 선택 확률 증가
  const weights = templates.map((_, index) => Math.pow(difficultyBias, templates.length - 1 - index));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let random = Math.random() * totalWeight;
  for (let i = 0; i < templates.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      const template = templates[i];
      return {
        id: uuidv4(),
        name: template.name,
        combatPower: template.combatPower,
        description: template.description,
      };
    }
  }

  // 폴백
  return createMonster(mapType);
}
