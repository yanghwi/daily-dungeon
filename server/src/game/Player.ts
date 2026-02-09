import { v4 as uuidv4 } from 'uuid';
import type { Character, Equipment, ItemEffect } from '@round-midnight/shared';
import { GAME_CONSTANTS } from '@round-midnight/shared';
import { prisma, getPrisma } from '../db/client.js';

// ─── 고정 4인 캐릭터 데이터 ───
export interface FixedCharacterData {
  pin: string;
  displayName: string;
  background: string;
  trait: string;
  weakness: string;
  bonusCategory: string;
  bonusValue: number;
  equipment: Equipment;
}

export const FIXED_CHARACTERS: FixedCharacterData[] = [
  {
    pin: '910531',
    displayName: '최양휘',
    background: '데이터 분석가',
    trait: '차분한',
    weakness: '숫자 없으면 불안함',
    bonusCategory: 'technical',
    bonusValue: 2,
    equipment: {
      weapon: '태블릿 PC',
      top: '체크 셔츠',
      bottom: '슬랙스',
      hat: '',
      accessory: '명상 쿠션',
      weaponBonus: 1,
      armorBonus: 1,
      accessoryEffect: { type: 'min_raise', minValue: 5 },
    },
  },
  {
    pin: '910530',
    displayName: '송동우',
    background: '마케팅 기획자',
    trait: '계획적인',
    weakness: '계획이 틀어지면 패닉',
    bonusCategory: 'social',
    bonusValue: 2,
    equipment: {
      weapon: '마케팅 기획안',
      top: '러닝 재킷',
      bottom: '트레이닝 바지',
      hat: '캡 모자',
      accessory: '스마트워치',
      weaponBonus: 1,
      armorBonus: 1,
      accessoryEffect: { type: 'min_raise', minValue: 3 },
    },
  },
  {
    pin: '911125',
    displayName: '홍솔',
    background: '스타트업 대표',
    trait: '자신감 넘치는',
    weakness: '투자 아이디어에 전투 집중력 저하',
    bonusCategory: 'creative',
    bonusValue: 2,
    equipment: {
      weapon: '유도복 띠',
      top: '유도복 상의',
      bottom: '유도복 바지',
      hat: '',
      accessory: '투자 제안서',
      weaponBonus: 2,
      armorBonus: 1,
      accessoryEffect: { type: 'min_raise', minValue: 4 },
    },
  },
  {
    pin: '910403',
    displayName: '정경훈',
    background: '기자',
    trait: '본능적인',
    weakness: '특종 냄새에 분별력 상실',
    bonusCategory: 'physical',
    bonusValue: 2,
    equipment: {
      weapon: '복싱 글러브',
      top: '트렌치코트',
      bottom: '청바지',
      hat: '',
      accessory: '녹음기',
      weaponBonus: 2,
      armorBonus: 1,
      accessoryEffect: { type: 'min_raise', minValue: 4 },
    },
  },
];

// PIN → 고정 캐릭터 데이터 조회
const FIXED_BY_PIN = new Map(FIXED_CHARACTERS.map((c) => [c.pin, c]));

// 배경별 프리셋 (FIXED_CHARACTERS에서 파생)
const BACKGROUND_PRESETS: Record<string, {
  trait: string;
  weakness: string;
  equipment: Equipment;
}> = Object.fromEntries(
  FIXED_CHARACTERS.map((c) => [c.background, {
    trait: c.trait,
    weakness: c.weakness,
    equipment: { ...c.equipment },
  }])
);

/**
 * userId(DB)로 고정 캐릭터 데이터 조회
 * DB에서 PIN을 가져온 뒤 FIXED_CHARACTERS에서 매핑
 */
export async function getFixedCharacterByUserId(userId: string): Promise<FixedCharacterData | null> {
  if (!prisma) return null;
  try {
    const user = await getPrisma().user.findUnique({ where: { id: userId }, select: { pin: true } });
    if (!user) return null;
    return FIXED_BY_PIN.get(user.pin) ?? null;
  } catch {
    return null;
  }
}

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
 * 참가 기록에서 XP/레벨 계산 (순수 함수, DB 비의존)
 */
export function calculateXpAndLevel(participations: { run: { wavesCleared: number | null; result: string } }[]): {
  totalXp: number;
  level: number;
  xp: number;
  xpToNext: number;
} {
  let totalXp = 0;
  for (const p of participations) {
    const wavesCleared = p.run.wavesCleared ?? 0;
    totalXp += 15;                                    // 참가 기본
    totalXp += wavesCleared * 25;                     // 웨이브당
    if (wavesCleared >= 5) totalXp += 15;             // 보스 보너스
    if (wavesCleared >= 10) totalXp += 15;            // 최종보스 보너스
    if (p.run.result === 'clear') totalXp += 50;      // 클리어 보너스
  }

  const level = Math.floor(Math.sqrt(totalXp / 50)) + 1;
  const currentLevelXp = (level - 1) * (level - 1) * 50;
  const nextLevelXp = level * level * 50;

  return {
    totalXp,
    level,
    xp: totalXp - currentLevelXp,
    xpToNext: nextLevelXp - currentLevelXp,
  };
}

/**
 * DB에서 유저의 XP를 계산하여 레벨 반환
 */
export async function getUserLevel(userId: string): Promise<number> {
  if (!prisma) return 1;

  try {
    const participations = await getPrisma().runParticipant.findMany({
      where: { userId },
      include: { run: { select: { wavesCleared: true, result: true } } },
    });

    return calculateXpAndLevel(participations).level;
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

