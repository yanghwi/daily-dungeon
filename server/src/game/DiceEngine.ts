import type { Character, ActionCategory, RollTier } from '@round-midnight/shared';
import type { ResolvedEffects } from './ItemEffectResolver.js';

/**
 * d20 주사위 굴림 (1~20)
 * 서버에서만 생성 — 치트 방지
 */
export function rollDice(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * 캐릭터 보정 합산: 배경 매칭 보너스 + 장비 보너스
 *
 * 배경별 강점 카테고리:
 *   데이터 분석가  → technical (+2)
 *   마케팅 기획자  → social (+2)
 *   스타트업 대표  → creative (+2)
 *   기자           → physical, defensive (+2)
 *
 * 장비 보너스:
 *   weaponBonus → physical 카테고리
 *   armorBonus  → defensive 카테고리
 */
export function calculateBonus(
  character: Character,
  category: ActionCategory,
  resolved?: ResolvedEffects,
): number {
  // TODO(human): 배경 → 보너스 카테고리 매핑을 구현하세요
  // BACKGROUND_CATEGORIES Record를 완성하고, backgroundBonus를 계산하세요
  const BACKGROUND_CATEGORIES: Record<string, ActionCategory[]> = {
    // 여기에 4인 캐릭터의 배경 → 강점 카테고리 매핑을 작성하세요
    // 예: '데이터 분석가': ['technical'],
  };

  const strongCategories = BACKGROUND_CATEGORIES[character.background] ?? [];
  const backgroundBonus = strongCategories.includes(category) ? 2 : 0;

  const weaponB = resolved ? resolved.weaponBonus : character.equipment.weaponBonus;
  const armorB = resolved ? resolved.armorBonus : character.equipment.armorBonus;
  let equipmentBonus = 0;
  if (category === 'physical') equipmentBonus += weaponB;
  if (category === 'defensive') equipmentBonus += armorB;

  return backgroundBonus + equipmentBonus;
}

/**
 * 주사위 결과 → RollTier 판정
 *
 * nat1:     roll === 1 (항상 실패)
 * nat20:    roll === 20 (항상 성공)
 * fail:     effectiveRoll < dc
 * normal:   effectiveRoll >= dc && effectiveRoll < dc + critMin
 * critical: effectiveRoll >= dc + critMin
 *
 * @param critMin critical 판정에 필요한 DC 초과량 (기본 5, crit_expand 효과로 감소)
 */
export function determineTier(roll: number, effectiveRoll: number, dc: number, critMin: number = 5): RollTier {
  if (roll === 1) return 'nat1';
  if (roll === 20) return 'nat20';
  if (effectiveRoll < dc) return 'fail';
  if (effectiveRoll >= dc + critMin) return 'critical';
  return 'normal';
}
