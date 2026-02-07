import { prisma } from '../../db/client.js';
import { UNLOCKABLES, type UnlockCondition } from './unlockables.js';

/** 런 종료 후 해금 체크 — 새로 해금된 항목 ID 배열 반환 */
export async function checkAndGrantUnlocks(userId: string): Promise<string[]> {
  if (!prisma) return [];

  // 이미 해금된 항목
  const existing = await prisma.userUnlock.findMany({
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
      await prisma.userUnlock.create({
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
}

async function getUserStats(userId: string): Promise<UserStats> {
  const [totalRuns, clears, dailyClears] = await Promise.all([
    prisma.runParticipant.count({ where: { userId } }),
    prisma.runResult.count({
      where: { participants: { some: { userId } }, result: 'clear' },
    }),
    prisma.runResult.count({
      where: {
        participants: { some: { userId } },
        result: 'clear',
        dailySeedId: { not: null },
      },
    }),
  ]);

  // 보스 킬 정보는 현재 DB에 저장하지 않으므로 런 횟수 기반으로만 체크
  // TODO: 상세 보스 킬 트래킹은 추후 추가
  const bossKills: string[] = [];
  const noDamageBosses: string[] = [];

  // 클리어 = 최종보스 처치로 간주
  if (clears > 0) {
    bossKills.push('midnight-clock');
  }

  return { totalRuns, clears, dailyClears, bossKills, noDamageBosses };
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
    default:
      return false;
  }
}
