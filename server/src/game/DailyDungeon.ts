import { prisma } from '../db/client.js';

// ─── Seeded PRNG (mulberry32) ───

export class SeededRandom {
  private state: number;

  constructor(seed: string) {
    // 문자열 seed → 32비트 정수
    this.state = this.hashSeed(seed);
  }

  private hashSeed(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return hash >>> 0; // unsigned
  }

  /** 0~1 사이 float 반환 (mulberry32) */
  next(): number {
    this.state += 0x6d2b79f5;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** min~max (inclusive) 정수 반환 */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** 배열에서 하나 선택 */
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** 가중 랜덤 선택 */
  weightedPick<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return items[i];
    }
    return items[items.length - 1];
  }
}

// ─── 데일리 시드 관리 ───

/** KST 기준 오늘 날짜의 Date 객체 (00:00:00 UTC) */
function getTodayKST(): Date {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const dateStr = kst.toISOString().split('T')[0];
  return new Date(dateStr + 'T00:00:00.000Z');
}

/** 오늘의 데일리 시드 가져오기 (없으면 생성) */
export async function getOrCreateDailySeed(): Promise<{ id: string; seed: string; date: Date }> {
  const todayKST = getTodayKST();

  if (!prisma) {
    // DB 없으면 날짜 기반 로컬 시드 반환
    const dateStr = todayKST.toISOString().split('T')[0];
    return { id: `local-${dateStr}`, seed: `daily-${dateStr}-rm`, date: todayKST };
  }

  let dailySeed = await prisma.dailySeed.findUnique({ where: { date: todayKST } });

  if (!dailySeed) {
    const dateStr = todayKST.toISOString().split('T')[0];
    const seedValue = `daily-${dateStr}-rm`;
    dailySeed = await prisma.dailySeed.create({
      data: { date: todayKST, seed: seedValue },
    });
  }

  return { id: dailySeed.id, seed: dailySeed.seed, date: dailySeed.date };
}
