import type {
  Player,
  Monster,
  Position,
  CombatResult,
  CombatOutcome,
  Item,
  MapType,
} from '@daily-dungeon/shared';
import { generateMonsterDrop } from './monsters.js';

// 전투 범위 (타일 단위)
const COMBAT_RANGE = 3;

// 전투 판정 파라미터
interface CombatParams {
  allPlayers: Player[];
  monster: Monster;
  monsterPos: Position;
  mapType: MapType;
}

// 범위 내 플레이어 찾기
function getPlayersInRange(
  allPlayers: Player[],
  monsterPos: Position,
  range: number
): Player[] {
  return allPlayers.filter((player) => {
    if (!player.isAlive || player.hasEscaped) return false;

    const distance = Math.sqrt(
      Math.pow(player.position.x - monsterPos.x, 2) +
      Math.pow(player.position.y - monsterPos.y, 2)
    );
    return distance <= range;
  });
}

// 파티 전투력 계산
function calculatePartyCombatPower(players: Player[]): number {
  return players.reduce((total, player) => {
    // 기본 전투력 + 장비 보정
    let power = player.combatPower;

    if (player.equipment.weapon) {
      power += player.equipment.weapon.combatPower;
    }
    if (player.equipment.armor) {
      power += player.equipment.armor.combatPower;
    }
    if (player.equipment.accessory) {
      power += player.equipment.accessory.combatPower;
    }

    return total + power;
  }, 0);
}

// 전투 결과 판정
function determineCombatResult(ratio: number): CombatResult {
  if (ratio >= 2.0) return 'perfect'; // 완벽한 승리 (2배 이상)
  if (ratio >= 1.2) return 'victory'; // 승리 (1.2배 이상)
  if (ratio >= 0.8) return 'narrow'; // 아슬아슬한 승리 (0.8배 이상)
  if (ratio >= 0.5) return 'defeat'; // 패배 (0.5배 이상)
  return 'wipe'; // 전멸 (0.5배 미만)
}

// 데미지 계산
function calculateDamages(
  participants: Player[],
  monster: Monster,
  result: CombatResult
): { playerId: string; damage: number }[] {
  const damages: { playerId: string; damage: number }[] = [];

  for (const player of participants) {
    let damage = 0;

    switch (result) {
      case 'perfect':
        damage = 0; // 피해 없음
        break;
      case 'victory':
        damage = Math.floor(monster.combatPower * 0.1 + Math.random() * 5);
        break;
      case 'narrow':
        damage = Math.floor(monster.combatPower * 0.3 + Math.random() * 10);
        break;
      case 'defeat':
        damage = Math.floor(monster.combatPower * 0.5 + Math.random() * 15);
        break;
      case 'wipe':
        damage = Math.floor(monster.combatPower * 0.8 + Math.random() * 20);
        break;
    }

    // 전사 클래스 피해 감소
    if (player.class === 'warrior') {
      damage = Math.floor(damage * 0.9);
    }

    // 방어구 피해 감소
    if (player.equipment.armor) {
      damage = Math.max(0, damage - Math.floor(player.equipment.armor.combatPower * 0.2));
    }

    damages.push({ playerId: player.id, damage });
  }

  return damages;
}

// 플레이어에게 데미지 적용
function applyDamages(
  players: Player[],
  damages: { playerId: string; damage: number }[]
): Player[] {
  const updatedPlayers: Player[] = [];

  for (const player of players) {
    const damageInfo = damages.find((d) => d.playerId === player.id);
    if (damageInfo) {
      const newHp = Math.max(0, player.hp - damageInfo.damage);
      const isAlive = newHp > 0;

      // 성직자 자동 힐 (전투 후)
      let healedHp = newHp;
      if (isAlive && player.class === 'cleric') {
        healedHp = Math.min(player.maxHp, newHp + Math.floor(player.maxHp * 0.1));
      }

      updatedPlayers.push({
        ...player,
        hp: healedHp,
        isAlive,
      });
    }
  }

  return updatedPlayers;
}

// 전투 즉시 판정
export function resolveCombat(params: CombatParams): {
  outcome: CombatOutcome;
  updatedPlayers: Player[];
} {
  const { allPlayers, monster, monsterPos, mapType } = params;

  // 범위 내 참전자 찾기
  const participants = getPlayersInRange(allPlayers, monsterPos, COMBAT_RANGE);

  if (participants.length === 0) {
    // 참전자 없음 - 에러 케이스
    throw new Error('No participants in combat range');
  }

  // 파티 전투력 계산
  const partyCombatPower = calculatePartyCombatPower(participants);

  // 판정 공식: (파티 전투력 / 적 전투력) × 랜덤(0.8~1.2)
  const randomMultiplier = 0.8 + Math.random() * 0.4;
  const ratio = (partyCombatPower / monster.combatPower) * randomMultiplier;

  // 결과 판정
  const result = determineCombatResult(ratio);

  // 데미지 계산
  const damages = calculateDamages(participants, monster, result);

  // 드랍 아이템 (승리 시)
  const drops: Item[] = [];
  if (result === 'perfect' || result === 'victory' || result === 'narrow') {
    const drop = generateMonsterDrop(mapType, monster.name);
    if (drop) {
      drops.push(drop);
    }
  }

  // 플레이어 상태 업데이트
  const updatedPlayers = applyDamages(allPlayers, damages);

  const outcome: CombatOutcome = {
    result,
    monster,
    monsterPosition: monsterPos,  // 전투 후 타일 업데이트용
    participants: participants.map((p) => p.id),
    damages,
    drops,
    description: '', // AI가 나중에 채움
  };

  return { outcome, updatedPlayers };
}

// 전투 범위 내 플레이어 확인 (외부 사용)
export function getParticipantsInRange(
  allPlayers: Player[],
  monsterPos: Position
): Player[] {
  return getPlayersInRange(allPlayers, monsterPos, COMBAT_RANGE);
}

// 전투 범위 상수 export
export const COMBAT_CONSTANTS = {
  RANGE: COMBAT_RANGE,
};
