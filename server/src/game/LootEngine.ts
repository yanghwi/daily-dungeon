import type { ItemDefinition, ItemRarity, LootItem, ItemEffect } from '@round-midnight/shared';
import { ALL_ITEMS } from './data/items/index.js';
import type { SeededRandom } from './DailyDungeon.js';

/** 레어리티별 드랍 확률 (가중치) */
const RARITY_WEIGHTS: Record<string, Record<ItemRarity, number>> = {
  normal:     { common: 50, uncommon: 30, rare: 15, legendary: 5 },
  boss:       { common: 30, uncommon: 30, rare: 25, legendary: 15 },
  finalBoss:  { common: 10, uncommon: 25, rare: 35, legendary: 30 },
};

/**
 * 가중 랜덤으로 레어리티 선택
 */
export function rollRarity(isBossWave: boolean, isFinalBoss: boolean = false, rng?: SeededRandom): ItemRarity {
  const weights = isFinalBoss ? RARITY_WEIGHTS.finalBoss : isBossWave ? RARITY_WEIGHTS.boss : RARITY_WEIGHTS.normal;
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let roll = (rng ? rng.next() : Math.random()) * total;

  for (const [rarity, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return rarity as ItemRarity;
  }

  return 'common';
}

/**
 * 가중 랜덤으로 아이템 하나 선택
 */
export function weightedRandom(items: ItemDefinition[], rng?: SeededRandom): ItemDefinition {
  const totalWeight = items.reduce((sum, item) => sum + item.dropWeight, 0);
  let roll = (rng ? rng.next() : Math.random()) * totalWeight;

  for (const item of items) {
    roll -= item.dropWeight;
    if (roll <= 0) return item;
  }

  return items[items.length - 1];
}

/**
 * ItemDefinition → LootItem 변환 (클라이언트 표시용)
 */
export function itemDefToLootItem(item: ItemDefinition): LootItem {
  return {
    itemId: item.id,
    name: item.name,
    type: item.type,
    rarity: item.rarity,
    description: item.description,
    effect: summarizeEffects(item.effects),
  };
}

/**
 * 효과 배열을 사람이 읽을 수 있는 문자열로 변환
 */
export function summarizeEffects(effects: ItemEffect[]): string {
  return effects.map((e) => {
    switch (e.type) {
      case 'stat_bonus':
        return e.stat === 'weaponBonus' ? `공격 +${e.value}` : `방어 +${e.value}`;
      case 'hp_restore':
        return `HP ${e.value} 회복`;
      case 'dc_reduction':
        return e.category === 'all' ? `전체 DC -${e.value}` : `${e.category} DC -${e.value}`;
      case 'min_raise':
        return `최소 굴림 ${e.minValue}`;
      case 'reroll':
        return `리롤 ${e.count}회`;
      case 'crit_expand':
        return `크리티컬 범위 +${5 - e.critMin}`;
      case 'damage_multiplier':
        return e.condition === 'boss'
          ? `보스 데미지 x${e.multiplier}`
          : `데미지 x${e.multiplier}`;
      case 'wave_heal':
        return `웨이브 시작 시 HP +${e.value}`;
      default:
        return '';
    }
  }).filter(Boolean).join(', ');
}

/**
 * 카탈로그 기반 루트 생성
 *
 * 보스 전용 보장:
 * - 중보스 (Wave 5): 1개 rare 이상 보장 + 보너스 드랍 1개
 * - 최종보스 (Wave 10): 1개 legendary 보장 + 보너스 드랍 2개
 */
export function generateLootFromCatalog(
  count: number,
  opts: { waveNumber: number; isBossWave: boolean; rng?: SeededRandom },
): ItemDefinition[] {
  const result: ItemDefinition[] = [];
  const usedIds = new Set<string>();
  const isFinalBoss = opts.isBossWave && opts.waveNumber >= 10;

  // 보스 보장 드랍: 첫 번째 아이템은 최소 레어리티 보장
  let guaranteedRarity: ItemRarity | null = null;
  if (isFinalBoss) {
    guaranteedRarity = 'legendary';
  } else if (opts.isBossWave) {
    guaranteedRarity = 'rare';
  }

  // 보스 보너스 드랍 수 추가
  const bonusCount = isFinalBoss ? 2 : opts.isBossWave ? 1 : 0;
  const totalCount = count + bonusCount;

  for (let i = 0; i < totalCount; i++) {
    let rarity: ItemRarity;

    if (i === 0 && guaranteedRarity) {
      // 보장 드랍: 해당 레어리티 이상만 허용
      rarity = guaranteedRarity;
    } else {
      rarity = rollRarity(opts.isBossWave, isFinalBoss, opts.rng);
    }

    // 해당 레어리티 + 웨이브/보스 조건에 맞는 아이템 필터
    const candidates = ALL_ITEMS.filter((item) => {
      if (item.rarity !== rarity) return false;
      if (item.waveMinimum && opts.waveNumber < item.waveMinimum) return false;
      if (item.bossOnly && !opts.isBossWave) return false;
      if (usedIds.has(item.id)) return false;
      return true;
    });

    if (candidates.length === 0) {
      // 조건에 맞는 아이템이 없으면 레어리티 제한 해제하고 재시도
      const fallback = ALL_ITEMS.filter((item) => {
        if (item.waveMinimum && opts.waveNumber < item.waveMinimum) return false;
        if (item.bossOnly && !opts.isBossWave) return false;
        if (usedIds.has(item.id)) return false;
        return true;
      });

      if (fallback.length === 0) break;
      const picked = weightedRandom(fallback, opts.rng);
      usedIds.add(picked.id);
      result.push(picked);
    } else {
      const picked = weightedRandom(candidates, opts.rng);
      usedIds.add(picked.id);
      result.push(picked);
    }
  }

  return result;
}
