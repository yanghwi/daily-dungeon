import type { Character, ActionCategory, ItemEffect } from '@round-midnight/shared';
import { GAME_CONSTANTS } from '@round-midnight/shared';
import { getItemById } from './data/items/index.js';
import { countEquippedTags, resolveSynergyEffects } from './SynergyResolver.js';

/** 장착된 아이템 효과의 집계 결과 */
export interface ResolvedEffects {
  weaponBonus: number;
  armorBonus: number;
  dcReductions: Map<ActionCategory | 'all', number>;
  rerollCount: number;
  minRaise: number;
  critMin: number;                  // 기본 5, 낮을수록 크리티컬 범위 넓음
  damageMultiplier: number;         // 기본 1.0
  bossDamageMultiplier: number;     // 기본 1.0
  waveHealAmount: number;
}

/**
 * 캐릭터의 장착 아이템 효과를 전부 집계한다.
 */
export function resolveEquippedEffects(character: Character): ResolvedEffects {
  const result: ResolvedEffects = {
    weaponBonus: character.equipment.weaponBonus,
    armorBonus: character.equipment.armorBonus,
    dcReductions: new Map(),
    rerollCount: 0,
    minRaise: 0,
    critMin: 5,
    damageMultiplier: 1.0,
    bossDamageMultiplier: 1.0,
    waveHealAmount: 0,
  };

  // 기존 accessoryEffect 호환 (itemId 없이 직접 지정된 경우)
  const acc = character.equipment.accessoryEffect;
  if (acc.type === 'reroll') result.rerollCount += acc.count;
  if (acc.type === 'min_raise') result.minRaise = Math.max(result.minRaise, acc.minValue);
  if (acc.type === 'crit_expand') result.critMin = Math.min(result.critMin, acc.critMin);

  // 장착된 아이템의 효과 집계
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

    for (const effect of itemDef.effects) {
      applyEffect(result, effect);
    }
  }

  // 임시 버프 (소모품 사용으로 얻은 것) 집계
  if (character.activeBuffs) {
    for (const buff of character.activeBuffs) {
      if (buff.remainingWaves > 0) {
        applyEffect(result, buff.effect);
      }
    }
  }

  // 시너지 효과 집계
  const tagCounts = countEquippedTags(character);
  const synergyEffects = resolveSynergyEffects(tagCounts);
  for (const effect of synergyEffects) {
    applyEffect(result, effect);
  }

  // 레벨 기반 DC 감소
  const { DC_REDUCTION_LEVELS, DC_REDUCTION_VALUE } = GAME_CONSTANTS.LEVEL_BONUSES;
  for (const lvl of DC_REDUCTION_LEVELS) {
    if (character.level >= lvl) {
      const current = result.dcReductions.get('all') ?? 0;
      result.dcReductions.set('all', current + DC_REDUCTION_VALUE);
    }
  }

  // 해금된 패시브 효과 적용
  if (character.unlockedPassives) {
    for (const effect of character.unlockedPassives) {
      applyEffect(result, effect);
    }
  }

  return result;
}

function applyEffect(result: ResolvedEffects, effect: ItemEffect): void {
  switch (effect.type) {
    case 'stat_bonus':
      if (effect.stat === 'weaponBonus') result.weaponBonus += effect.value;
      if (effect.stat === 'armorBonus') result.armorBonus += effect.value;
      break;
    case 'dc_reduction': {
      const current = result.dcReductions.get(effect.category) ?? 0;
      result.dcReductions.set(effect.category, current + effect.value);
      break;
    }
    case 'reroll':
      result.rerollCount += effect.count;
      break;
    case 'min_raise':
      result.minRaise = Math.max(result.minRaise, effect.minValue);
      break;
    case 'crit_expand':
      result.critMin = Math.min(result.critMin, effect.critMin);
      break;
    case 'damage_multiplier':
      if (effect.condition === 'boss') {
        result.bossDamageMultiplier *= effect.multiplier;
      } else {
        result.damageMultiplier *= effect.multiplier;
      }
      break;
    case 'wave_heal':
      result.waveHealAmount += effect.value;
      break;
  }
}

/**
 * 특정 카테고리에 대한 DC 감소량을 구한다 (all 포함)
 */
export function getDcReduction(resolved: ResolvedEffects, category: ActionCategory): number {
  const specific = resolved.dcReductions.get(category) ?? 0;
  const all = resolved.dcReductions.get('all') ?? 0;
  return specific + all;
}
