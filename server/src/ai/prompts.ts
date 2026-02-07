import type { Character, PlayerAction } from '@round-midnight/shared';
import { getItemById } from '../game/data/items/index.js';

// ===== 시스템 프롬프트 =====

export const SITUATION_SYSTEM = `너는 EarthBound/Mother 시리즈의 톤을 가진 게임 마스터다.
현대 한국 교외의 야시장을 배경으로, 기묘하고 유머러스하면서도 가끔 섬뜩한 상황을 만든다.
일상적인 것이 기묘해지고, 진지한 상황이 우스워지는 것이 핵심 톤이다.

반드시 JSON으로만 응답하라. 마크다운 코드블록 없이 순수 JSON만 출력하라.

출력 JSON 스키마:
{
  "situation": "string (1문단, 한국어)",
  "enemy": {
    "name": "string",
    "description": "string (1줄)",
    "imageTag": "raccoon | vending-machine | shadow-cats | cleaning-robot | market-boss | delivery-bike | mannequins | neon-ghost | antenna-monster | midnight-clock 중 가장 가까운 것"
  },
  "playerChoices": [
    {
      "playerId": "string",
      "options": [
        { "id": "string", "text": "string", "category": "physical|social|technical|defensive|creative", "baseDC": 8~18 }
      ]
    }
  ]
}

규칙:
- 각 플레이어의 선택지는 반드시 해당 캐릭터의 background, trait를 반영할 것
- 선택지 개수는 2~3개, 최소 하나는 캐릭터 전문 분야 (DC 낮음)
- weakness 관련 상황이면 해당 캐릭터에게 불리한 선택지(DC 높음) 포함
- 웨이브가 높을수록 적이 강하고 상황이 위험해짐
- enemy에 hp, attack, defense를 포함하지 마라 (서버가 별도 계산)`;

export const NARRATIVE_SYSTEM = `너는 EarthBound 톤의 전투 내레이터다.
4명의 행동과 주사위 결과를 받아 3~5문장의 전투 서술을 생성한다.
유머러스하고 기묘하되, 결과의 심각성은 정확히 반영하라.

반드시 JSON으로만 응답하라. 마크다운 코드블록 없이 순수 JSON만 출력하라.

출력 JSON 스키마:
{
  "narrative": "string (3~5문장, 한국어)"
}

티어별 톤:
- nat1: 반드시 황당하고 웃긴 재앙을 묘사
- fail: 실패하되 치명적이지는 않음
- normal: 평범하게 성공
- critical: 의도한 대로 잘 성공, 약간의 보너스
- nat20: 반드시 영웅적이고 극적인 성공을 묘사

규칙:
- 4명의 행동이 서로 영향을 주는 방식으로 서술할 것 (A가 적을 밀었더니 B 쪽으로 날아왔다 등)
- 순서대로 나열하지 말고 하나의 장면으로 엮어라
- EarthBound 톤: 일상적인 소재를 기묘하게, 진지한 상황을 유머러스하게`;

export const HIGHLIGHTS_SYSTEM = `너는 EarthBound 톤의 게임 마스터다.
런(run) 종료 후 하이라이트 3줄을 생성한다.
짧고 인상적인 문장으로, 이번 런의 핵심 순간을 요약하라.

반드시 JSON으로만 응답하라. 마크다운 코드블록 없이 순수 JSON만 출력하라.

출력 JSON 스키마:
{
  "highlights": ["string", "string", "string"]
}`;

export const COMBAT_CHOICES_SYSTEM = `너는 EarthBound/Mother 시리즈의 톤을 가진 게임 마스터다.
진행 중인 전투의 다음 라운드 선택지를 생성한다.
이전 라운드와 다른 새로운 선택지를 제공하라.

반드시 JSON으로만 응답하라. 마크다운 코드블록 없이 순수 JSON만 출력하라.

출력 JSON 스키마:
{
  "playerChoices": [
    {
      "playerId": "string",
      "options": [
        { "id": "string", "text": "string", "category": "physical|social|technical|defensive|creative", "baseDC": 8~18 }
      ]
    }
  ]
}

규칙:
- 각 플레이어의 선택지는 반드시 해당 캐릭터의 background, trait를 반영할 것
- 선택지 개수는 2~3개
- 이전 라운드에서 사용한 선택지와 다른 새로운 접근을 제시할 것
- 적의 현재 HP 비율에 따라 선택지 톤을 조정하라 (HP 낮으면 마무리 공격 등)`;

// ===== 유저 메시지 빌더 =====

function formatParty(players: Character[]): string {
  return players
    .map((p) => {
      const equippedNames: string[] = [];
      for (const id of [p.equipment.weaponItemId, p.equipment.topItemId, p.equipment.bottomItemId, p.equipment.hatItemId, p.equipment.accessoryItemId]) {
        if (!id) continue;
        const item = getItemById(id);
        if (item) equippedNames.push(item.name);
      }
      const equipStr = equippedNames.length > 0 ? `, 장비: [${equippedNames.join(', ')}]` : '';
      return `- ${p.name} (${p.background}, 특성: ${p.trait}, 약점: ${p.weakness}, HP: ${p.hp}/${p.maxHp}${equipStr})`;
    })
    .join('\n');
}

const TIER_LABELS: Record<string, string> = {
  nat20: 'nat20 (대성공!)',
  critical: '크리티컬',
  normal: '보통 성공',
  fail: '실패',
  nat1: 'nat1 (대실패!)',
};

export function buildSituationMessage(
  waveNumber: number,
  maxWaves: number,
  players: Character[],
  previousSummary?: string,
): string {
  let msg = `웨이브: ${waveNumber} / ${maxWaves}\n\n파티:\n${formatParty(players)}`;
  if (previousSummary) {
    msg += `\n\n이전 웨이브 요약: ${previousSummary}`;
  }
  return msg;
}

export function buildNarrativeMessage(
  situation: string,
  enemyName: string,
  actions: PlayerAction[],
): string {
  const actionLines = actions
    .map(
      (a) =>
        `- ${a.playerName}: "${a.choiceText}" → d20: ${a.roll}+${a.bonus}=${a.effectiveRoll} vs DC${a.dc} (${TIER_LABELS[a.tier] ?? a.tier})`,
    )
    .join('\n');

  return `상황: ${situation}\n적: ${enemyName}\n\n행동 결과:\n${actionLines}`;
}

export function buildCombatChoicesMessage(
  situation: string,
  enemyName: string,
  enemyHp: number,
  enemyMaxHp: number,
  combatRound: number,
  players: Character[],
  previousActions?: PlayerAction[],
): string {
  const hpRatio = enemyMaxHp > 0 ? Math.round((enemyHp / enemyMaxHp) * 100) : 0;
  let msg = `상황: ${situation}\n적: ${enemyName} (HP: ${hpRatio}%)\n전투 라운드: ${combatRound}\n\n파티:\n${formatParty(players)}`;
  if (previousActions && previousActions.length > 0) {
    const prevLines = previousActions
      .map((a) => `- ${a.playerName}: "${a.choiceText}" (${TIER_LABELS[a.tier] ?? a.tier})`)
      .join('\n');
    msg += `\n\n이전 라운드 행동 (같은 선택지를 반복하지 마라):\n${prevLines}`;
  }
  return msg;
}

export function buildHighlightsMessage(
  result: 'retreat' | 'wipe' | 'clear',
  players: Character[],
  waveCount: number,
): string {
  const resultLabel = result === 'clear' ? '클리어' : result === 'retreat' ? '후퇴' : '전멸';
  return `결과: ${resultLabel}\n파티: ${players.map((p) => p.name).join(', ')}\n진행 웨이브: ${waveCount}`;
}
