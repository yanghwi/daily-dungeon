import type {
  PlayerAction,
  Enemy,
  DamageResult,
  Character,
  LootItem,
  RollTier,
} from '@round-midnight/shared';
import { GAME_CONSTANTS } from '@round-midnight/shared';
import { LOOT_TABLE } from './data/hardcodedData.js';

/** 티어별 데미지 배율 및 플레이어 피해 비율 */
const TIER_DAMAGE: Record<RollTier, { dmgMultiplier: number; playerHitRatio: number }> = {
  nat20:    { dmgMultiplier: 3,   playerHitRatio: 0 },
  critical: { dmgMultiplier: 2,   playerHitRatio: 0 },
  normal:   { dmgMultiplier: 1,   playerHitRatio: 0.3 },
  fail:     { dmgMultiplier: 0,   playerHitRatio: 0.7 },
  nat1:     { dmgMultiplier: 0,   playerHitRatio: 1 },
};

/**
 * 4명의 행동 결과로 적/아군 데미지 계산
 */
export function calculateDamage(actions: PlayerAction[], enemy: Enemy): DamageResult {
  const BASE = GAME_CONSTANTS.BASE_DAMAGE;

  let totalEnemyDamage = 0;
  const playerDamages: { playerId: string; damage: number }[] = [];

  for (const action of actions) {
    const { dmgMultiplier, playerHitRatio } = TIER_DAMAGE[action.tier];
    totalEnemyDamage += BASE * dmgMultiplier;
    playerDamages.push({
      playerId: action.playerId,
      damage: Math.floor(enemy.attack * playerHitRatio),
    });
  }

  // 적 방어력 적용
  totalEnemyDamage = Math.max(0, totalEnemyDamage - enemy.defense);

  const enemyDefeated = totalEnemyDamage >= enemy.hp;

  return {
    enemyDamage: totalEnemyDamage,
    playerDamages,
    enemyDefeated,
    loot: enemyDefeated ? generateLoot(1) : [],
  };
}

/**
 * 플레이어 HP에 데미지 적용, isAlive 갱신
 */
export function applyDamageToPlayers(players: Character[], damageResult: DamageResult): Character[] {
  return players.map((p) => {
    const dmg = damageResult.playerDamages.find((d) => d.playerId === p.id);
    if (!dmg || dmg.damage === 0) return p;

    const newHp = Math.max(0, p.hp - dmg.damage);
    return { ...p, hp: newHp, isAlive: newHp > 0 };
  });
}

/**
 * 전리품 랜덤 생성 (적 처치 시)
 */
export function generateLoot(count: number): LootItem[] {
  const shuffled = [...LOOT_TABLE].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
