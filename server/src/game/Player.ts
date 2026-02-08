import { v4 as uuidv4 } from 'uuid';
import type { Character, Equipment, ItemEffect } from '@round-midnight/shared';
import { GAME_CONSTANTS } from '@round-midnight/shared';
import { prisma, getPrisma } from '../db/client.js';

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
      top: '두꺼운 패딩',
      bottom: '작업 바지',
      hat: '경비 모자',
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
      top: '앞치마',
      bottom: '체크 팬츠',
      hat: '요리사 모자',
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
      top: '후디',
      bottom: '트레이닝 바지',
      hat: '',
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
      top: '정장 상의',
      bottom: '정장 바지',
      hat: '',
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
export function createCharacter(
  socketId: string,
  name: string,
  userId?: string,
  level: number = 1,
  unlockedPassives: ItemEffect[] = [],
): Character {
  const { HP_PER_LEVEL, HP_CAP } = GAME_CONSTANTS.LEVEL_BONUSES;
  const hpBonus = Math.min(HP_CAP, (level - 1) * HP_PER_LEVEL);
  const hp = GAME_CONSTANTS.DEFAULT_HP + hpBonus;

  return {
    id: uuidv4(),
    socketId,
    userId,
    name,
    background: '',
    trait: '',
    weakness: '',
    hp,
    maxHp: hp,
    isAlive: true,
    level,
    equipment: {
      weapon: '',
      top: '',
      bottom: '',
      hat: '',
      accessory: '',
      weaponBonus: 0,
      armorBonus: 0,
      accessoryEffect: { type: 'none' },
    },
    inventory: [],
    activeBuffs: [],
    unlockedPassives,
  };
}

/**
 * DB에서 유저의 XP를 계산하여 레벨 반환 (routes.ts의 XP 공식 재사용)
 */
export async function getUserLevel(userId: string): Promise<number> {
  if (!prisma) return 1;

  try {
    const participations = await getPrisma().runParticipant.findMany({
      where: { userId },
      include: { run: { select: { wavesCleared: true, result: true } } },
    });

    let totalXp = 0;
    for (const p of participations) {
      const wavesCleared = p.run.wavesCleared ?? 0;
      totalXp += 15;                                    // 참가 기본
      totalXp += wavesCleared * 25;                     // 웨이브당
      if (wavesCleared >= 5) totalXp += 15;             // 보스 보너스
      if (wavesCleared >= 10) totalXp += 15;            // 최종보스 보너스
      if (p.run.result === 'clear') totalXp += 50;      // 클리어 보너스
    }

    return Math.floor(Math.sqrt(totalXp / 50)) + 1;
  } catch (err) {
    console.error('[getUserLevel] DB error:', err);
    return 1;
  }
}

/**
 * 캐릭터 설정 적용 (배경 선택 후)
 * level/unlockedPassives는 createCharacter에서 이미 설정됨 → 스프레드로 유지
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

