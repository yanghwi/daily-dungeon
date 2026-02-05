import type { Character, ActionCategory, RollTier } from '@round-midnight/shared';

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
 *   전직 경비원 → physical, defensive (+2)
 *   요리사       → creative (+2)
 *   개발자       → technical (+2)
 *   영업사원     → social (+2)
 *
 * 장비 보너스:
 *   weaponBonus → physical 카테고리
 *   armorBonus  → defensive 카테고리
 */
export function calculateBonus(character: Character, category: ActionCategory): number {
  const BACKGROUND_CATEGORIES: Record<string, ActionCategory[]> = {
    '전직 경비원': ['physical', 'defensive'],
    '요리사': ['creative'],
    '개발자': ['technical'],
    '영업사원': ['social'],
  };

  const strongCategories = BACKGROUND_CATEGORIES[character.background] ?? [];
  const backgroundBonus = strongCategories.includes(category) ? 2 : 0;

  let equipmentBonus = 0;
  if (category === 'physical') equipmentBonus += character.equipment.weaponBonus;
  if (category === 'defensive') equipmentBonus += character.equipment.armorBonus;

  return backgroundBonus + equipmentBonus;
}

/**
 * 주사위 결과 → RollTier 판정
 *
 * nat1:     roll === 1 (항상 실패)
 * nat20:    roll === 20 (항상 성공)
 * fail:     effectiveRoll < dc
 * normal:   effectiveRoll >= dc && effectiveRoll < dc + 5
 * critical: effectiveRoll >= dc + 5
 */
export function determineTier(roll: number, effectiveRoll: number, dc: number): RollTier {
  if (roll === 1) return 'nat1';
  if (roll === 20) return 'nat20';
  if (effectiveRoll < dc) return 'fail';
  if (effectiveRoll >= dc + 5) return 'critical';
  return 'normal';
}
