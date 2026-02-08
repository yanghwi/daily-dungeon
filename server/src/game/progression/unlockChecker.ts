import type { ItemEffect } from '@round-midnight/shared';
import { prisma, getPrisma } from '../../db/client.js';
import { UNLOCKABLES, type UnlockCondition } from './unlockables.js';
import { getUserLevel } from '../Player.js';

/** 런 종료 후 해금 체크 — 새로 해금된 항목 ID 배열 반환 */
export async function checkAndGrantUnlocks(userId: string): Promise<string[]> {
  if (!prisma) return [];

  // 이미 해금된 항목
  const existing = await getPrisma().userUnlock.findMany({
    where: { userId },
    select: { unlockableId: true },
  });
  const unlockedIds = new Set(existing.map((u: any) => u.unlockableId as string));

  // 유저 통계
  const stats = await getUserStats(userId);

  const newUnlocks: string[] = [];

  for (const unlockable of UNLOCKABLES) {
    if (unlockedIds.has(unlockable.id)) continue;

    if (isConditionMet(unlockable.condition, stats)) {
      await getPrisma().userUnlock.create({
        data: { userId, unlockableId: unlockable.id },
      });
      newUnlocks.push(unlockable.id);
    }
  }

  return newUnlocks;
}

interface UserStats {
  totalRuns: number;
  clears: number;
  dailyClears: number;
  bossKills: string[];       // 처치한 보스 이름 목록
  noDamageBosses: string[];  // 무피해 처치한 보스 이름 목록
  totalWavesCleared: number; // 누적 웨이브 클리어 수
  level: number;             // 유저 레벨
}

async function getUserStats(userId: string): Promise<UserStats> {
  const db = getPrisma();
  const [totalRuns, clears, dailyClears, wavesAgg, level] = await Promise.all([
    db.runParticipant.count({ where: { userId } }),
    db.runResult.count({
      where: { participants: { some: { userId } }, result: 'clear' },
    }),
    db.runResult.count({
      where: {
        participants: { some: { userId } },
        result: 'clear',
        dailySeedId: { not: null },
      },
    }),
    db.runResult.aggregate({
      where: { participants: { some: { userId } } },
      _sum: { wavesCleared: true },
    }),
    getUserLevel(userId),
  ]);

  // 보스 킬 정보는 현재 DB에 저장하지 않으므로 런 횟수 기반으로만 체크
  const bossKills: string[] = [];
  const noDamageBosses: string[] = [];

  // 클리어 = 최종보스 처치로 간주
  if (clears > 0) {
    bossKills.push('midnight-clock');
  }

  return {
    totalRuns,
    clears,
    dailyClears,
    bossKills,
    noDamageBosses,
    totalWavesCleared: wavesAgg._sum.wavesCleared ?? 0,
    level,
  };
}

function isConditionMet(condition: UnlockCondition, stats: UserStats): boolean {
  switch (condition.type) {
    case 'clears':
      return stats.clears >= condition.count;
    case 'runs':
      return stats.totalRuns >= condition.count;
    case 'bossKill':
      return stats.bossKills.includes(condition.boss);
    case 'noDamageBoss':
      return stats.noDamageBosses.includes(condition.boss);
    case 'dailyClears':
      return stats.dailyClears >= condition.count;
    case 'wavesTotal':
      return stats.totalWavesCleared >= condition.count;
    case 'level':
      return stats.level >= condition.level;
    default:
      return false;
  }
}

/**
 * 유저의 해금된 패시브 효과를 반환 (방 생성/참가 시 캐릭터에 적용)
 */
export async function getUnlockedPassives(userId: string): Promise<ItemEffect[]> {
  if (!prisma) return [];

  try {
    const existing = await getPrisma().userUnlock.findMany({
      where: { userId },
      select: { unlockableId: true },
    });
    const unlockedIds = new Set(existing.map((u: any) => u.unlockableId as string));

    const passives: ItemEffect[] = [];
    for (const unlockable of UNLOCKABLES) {
      if (!unlockedIds.has(unlockable.id)) continue;
      if (unlockable.reward?.type === 'passive_bonus') {
        passives.push(...unlockable.reward.effects);
      }
    }

    return passives;
  } catch (err) {
    console.error('[getUnlockedPassives] error:', err);
    return [];
  }
}
