import type { Character, ItemEffect, ActiveSynergy } from '@round-midnight/shared';
import { getItemById } from './data/items/index.js';

// ===== 시너지 정의 =====

interface SynergyTier {
  threshold: number;
  effects: ItemEffect[];
  description: string;
}

interface SynergyDefinition {
  tag: string;
  name: string;
  tiers: SynergyTier[];
}

const SYNERGIES: SynergyDefinition[] = [
  {
    tag: 'cooking',
    name: '야시장 셰프',
    tiers: [
      { threshold: 2, effects: [{ type: 'wave_heal', value: 2 }], description: 'wave_heal +2' },
      { threshold: 3, effects: [{ type: 'wave_heal', value: 2 }, { type: 'stat_bonus', stat: 'weaponBonus', value: 2 }], description: 'wave_heal +2, 공격력 +2' },
    ],
  },
  {
    tag: 'neon',
    name: '네온 라이트',
    tiers: [
      { threshold: 2, effects: [{ type: 'dc_reduction', category: 'all', value: 1 }], description: 'DC -1 (전체)' },
      { threshold: 3, effects: [{ type: 'dc_reduction', category: 'all', value: 1 }, { type: 'damage_multiplier', multiplier: 1.3 }], description: 'DC -1, 데미지 ×1.3' },
    ],
  },
  {
    tag: 'tactical',
    name: '전술가',
    tiers: [
      { threshold: 2, effects: [{ type: 'stat_bonus', stat: 'armorBonus', value: 2 }, { type: 'dc_reduction', category: 'physical', value: 1 }], description: '방어력 +2, DC -1 (물리)' },
    ],
  },
  {
    tag: 'retro',
    name: '8비트 전사',
    tiers: [
      { threshold: 2, effects: [{ type: 'crit_expand', critMin: 3 }], description: '크리 범위 확장' },
      { threshold: 3, effects: [{ type: 'crit_expand', critMin: 3 }, { type: 'stat_bonus', stat: 'armorBonus', value: 3 }], description: '크리 확장 + 방어력 +3' },
    ],
  },
  {
    tag: 'social',
    name: '인기인',
    tiers: [
      { threshold: 2, effects: [{ type: 'dc_reduction', category: 'social', value: 1 }], description: 'DC -1 (사교)' },
      { threshold: 3, effects: [{ type: 'dc_reduction', category: 'social', value: 1 }, { type: 'dc_reduction', category: 'creative', value: 1 }], description: 'DC -1 (사교+창의)' },
    ],
  },
  {
    tag: 'legendary',
    name: '전설 수집가',
    tiers: [
      { threshold: 2, effects: [{ type: 'min_raise', minValue: 3 }], description: '최소 주사위 3' },
      { threshold: 3, effects: [{ type: 'min_raise', minValue: 3 }, { type: 'reroll', count: 1 }], description: '최소 3 + 리롤 +1' },
      { threshold: 4, effects: [{ type: 'min_raise', minValue: 3 }, { type: 'reroll', count: 1 }, { type: 'damage_multiplier', multiplier: 1.2 }], description: '최소 3 + 리롤 +1 + 데미지 ×1.2' },
    ],
  },
];

// ===== 태그 카운팅 =====

/**
 * 캐릭터의 장착 아이템에서 태그 카운트를 집계
 */
export function countEquippedTags(character: Character): Map<string, number> {
  const counts = new Map<string, number>();

  const equippedItemIds = [
    character.equipment.weaponItemId,
    character.equipment.topItemId,
    character.equipment.bottomItemId,
    character.equipment.hatItemId,
    character.equipment.accessoryItemId,
  ].filter((id): id is string => !!id);

  for (const itemId of equippedItemIds) {
    const itemDef = getItemById(itemId);
    if (!itemDef) continue;

    for (const tag of itemDef.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return counts;
}

// ===== 시너지 해석 =====

/**
 * tagCounts를 받아 SYNERGIES 정의에서 발동 가능한 최고 티어의 효과를 모아 반환한다.
 * 같은 시너지에서 여러 tier가 충족되면 가장 높은 tier만 적용 (tiers는 threshold 오름차순).
 */
export function resolveSynergyEffects(tagCounts: Map<string, number>): ItemEffect[] {
  const result: ItemEffect[] = [];

  for (const synergy of SYNERGIES) {
    const count = tagCounts.get(synergy.tag) ?? 0;

    let bestTier: SynergyTier | null = null;
    for (const tier of synergy.tiers) {
      if (count >= tier.threshold) {
        bestTier = tier;
      }
    }

    if (bestTier) {
      result.push(...bestTier.effects);
    }
  }

  return result;
}

// ===== 클라이언트 표시용 =====

/**
 * 캐릭터의 활성 시너지 목록 (UI 표시용)
 */
export function getActiveSynergies(character: Character): ActiveSynergy[] {
  const tagCounts = countEquippedTags(character);
  const result: ActiveSynergy[] = [];

  for (const synergy of SYNERGIES) {
    const count = tagCounts.get(synergy.tag) ?? 0;
    if (count < 1) continue;

    // 발동된 최고 티어 찾기
    let activeTier: SynergyTier | null = null;
    for (const tier of synergy.tiers) {
      if (count >= tier.threshold) {
        activeTier = tier;
      }
    }

    // 다음 티어 (아직 미달성인 첫 번째 티어)
    const nextTier = synergy.tiers.find((t) => count < t.threshold);

    if (activeTier) {
      result.push({
        tag: synergy.tag,
        name: synergy.name,
        count,
        threshold: activeTier.threshold,
        bonusDescription: activeTier.description,
      });
    } else if (nextTier) {
      // 아직 발동 안 됐지만 진행 중인 시너지
      result.push({
        tag: synergy.tag,
        name: synergy.name,
        count,
        threshold: nextTier.threshold,
        bonusDescription: `${count}/${nextTier.threshold}`,
      });
    }
  }

  return result;
}
