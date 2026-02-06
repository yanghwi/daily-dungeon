import { v4 as uuidv4 } from 'uuid';
import type { Character, Equipment } from '@round-midnight/shared';
import { GAME_CONSTANTS } from '@round-midnight/shared';

// 배경별 기본 장비 및 스탯
const BACKGROUND_PRESETS: Record<string, {
  trait: string;
  weakness: string;
  equipment: Equipment;
}> = {
  '전직 경비원': {
    trait: '용감한',
    weakness: '어둠을 무서워함',
    equipment: {
      weapon: '알루미늄 배트',
      armor: '두꺼운 패딩',
      accessory: '행운의 열쇠고리',
      weaponBonus: 2,
      armorBonus: 1,
      accessoryEffect: { type: 'none' },
    },
  },
  '요리사': {
    trait: '호기심 많은',
    weakness: '거미 공포증',
    equipment: {
      weapon: '식칼',
      armor: '앞치마',
      accessory: '손목시계',
      weaponBonus: 2,
      armorBonus: 1,
      accessoryEffect: { type: 'min_raise', minValue: 3 },
    },
  },
  '개발자': {
    trait: '겁 많은',
    weakness: '사회적 상황에 약함',
    equipment: {
      weapon: '노트북',
      armor: '후디',
      accessory: '보조배터리',
      weaponBonus: 1,
      armorBonus: 1,
      accessoryEffect: { type: 'min_raise', minValue: 5 },
    },
  },
  '영업사원': {
    trait: '말빨 좋은',
    weakness: '체력이 약함',
    equipment: {
      weapon: '명함',
      armor: '정장',
      accessory: '고급 볼펜',
      weaponBonus: 1,
      armorBonus: 1,
      accessoryEffect: { type: 'min_raise', minValue: 4 },
    },
  },
};

/**
 * 로비 참가 시 임시 캐릭터 생성 (배경 미선택 상태)
 */
export function createCharacter(socketId: string, name: string): Character {
  return {
    id: uuidv4(),
    socketId,
    name,
    background: '',
    trait: '',
    weakness: '',
    hp: GAME_CONSTANTS.DEFAULT_HP,
    maxHp: GAME_CONSTANTS.DEFAULT_MAX_HP,
    isAlive: true,
    equipment: {
      weapon: '',
      armor: '',
      accessory: '',
      weaponBonus: 0,
      armorBonus: 0,
      accessoryEffect: { type: 'none' },
    },
  };
}

/**
 * 캐릭터 설정 적용 (배경 선택 후)
 */
export function applyBackground(character: Character, background: string): Character {
  const preset = BACKGROUND_PRESETS[background];
  if (!preset) return character;

  return {
    ...character,
    background,
    trait: preset.trait,
    weakness: preset.weakness,
    equipment: { ...preset.equipment },
  };
}

