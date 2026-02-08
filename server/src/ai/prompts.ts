import type { Character, PlayerAction } from '@round-midnight/shared';
import { getItemById } from '../game/data/items/index.js';

// ===== 시스템 프롬프트 =====

export const SITUATION_SYSTEM = `너는 EarthBound/Mother 시리즈의 톤을 가진 게임 마스터다.
현대 한국 교외의 야시장 배경. 일상적 소재를 기묘하게 배치.

톤 규칙 (필수):
- situation은 2문장 이내. 감정 묘사 금지, 사실만 서술
- 비유보다 직접 묘사. "갑자기", "놀랍게도", "기이한" 등 수식어 금지
- 나쁜 예: "어둠 속에서 갑자기 기이한 자판기가 분노에 찬 듯 붉게 빛나며 나타났습니다!"
- 좋은 예: "미친 자판기가 나타났다! 콜라 캔이 총알처럼 날아온다."
- enemy.description도 10자 이내로 짧게

반드시 JSON으로만 응답하라. 마크다운 코드블록 없이 순수 JSON만 출력하라.

출력 JSON 스키마:
{
  "situation": "string (2문장 이내, 한국어)",
  "enemy": {
    "name": "string",
    "description": "string (10자 이내)",
    "imageTag": "raccoon | vending-machine | shadow-cats | cleaning-robot | market-boss | delivery-bike | mannequins | neon-ghost | antenna-monster | midnight-clock 중 가장 가까운 것"
  },
  "playerChoices": [
    {
      "playerId": "string",
      "options": [
        { "id": "string", "text": "string (15자 이내)", "category": "physical|social|technical|defensive|creative", "baseDC": 8~18 }
      ]
    }
  ]
}

규칙:
- 각 플레이어의 선택지는 반드시 해당 캐릭터의 background, trait를 반영할 것
- 선택지 개수는 2~3개, 최소 하나는 캐릭터 전문 분야 (DC 낮음)
- weakness 관련 상황이면 해당 캐릭터에게 불리한 선택지(DC 높음) 포함
- 웨이브가 높을수록 적이 강하고 상황이 위험해짐
- enemy에 hp, attack, defense를 포함하지 마라 (서버가 별도 계산)
- 이전 웨이브의 적이나 상황을 절대 언급하지 마라. 각 웨이브는 독립적인 새로운 조우다
- "이번 웨이브의 적" 정보가 주어지면 반드시 해당 적만 묘사하라`;

export const NARRATIVE_SYSTEM = `너는 EarthBound 톤의 전투 내레이터다.
4명의 행동과 주사위 결과를 받아 2~3문장의 짧은 전투 서술을 생성한다.

톤 규칙 (필수):
- 2~3문장 이내. 절대 길게 쓰지 마라
- 감정 묘사 금지. 사실과 행동만 서술
- "갑자기", "놀랍게도", "기이한" 등 수식어 금지
- 비유보다 직접 묘사 우선

반드시 JSON으로만 응답하라. 마크다운 코드블록 없이 순수 JSON만 출력하라.

출력 JSON 스키마:
{
  "narrative": "string (2~3문장, 한국어)"
}

티어별 톤:
- nat1: 황당하고 웃긴 재앙 (1문장)
- fail: 실패 (1문장)
- normal: 성공 (1문장)
- critical: 멋진 성공 (1문장)
- nat20: 극적 성공 (1문장)

규칙:
- 4명의 행동을 하나의 장면으로 엮되 짧게
- 순서대로 나열 금지
- "현재 적:" 필드에 명시된 적만 서술에 포함할 것. 이전 웨이브의 적을 절대 언급하지 마라`;

export const HIGHLIGHTS_SYSTEM = `너는 EarthBound 톤의 게임 마스터다.
런 종료 후 하이라이트 3줄 생성. 각 줄 15자 이내.

톤 규칙: 감정 묘사 금지. 사실만. 수식어 금지.

반드시 JSON으로만 응답하라. 마크다운 코드블록 없이 순수 JSON만 출력하라.

출력 JSON 스키마:
{
  "highlights": ["string (15자 이내)", "string (15자 이내)", "string (15자 이내)"]
}`;

export const COMBAT_CHOICES_SYSTEM = `너는 EarthBound/Mother 시리즈의 톤을 가진 게임 마스터다.
다음 라운드 선택지 생성. 이전과 다른 새 선택지.

반드시 JSON으로만 응답하라. 마크다운 코드블록 없이 순수 JSON만 출력하라.

출력 JSON 스키마:
{
  "playerChoices": [
    {
      "playerId": "string",
      "options": [
        { "id": "string", "text": "string (15자 이내)", "category": "physical|social|technical|defensive|creative", "baseDC": 8~18 }
      ]
    }
  ]
}

규칙:
- 각 플레이어의 선택지는 해당 캐릭터의 background, trait 반영
- 선택지 개수는 2~3개
- 이전 라운드와 다른 접근 제시
- 적 HP 낮으면 마무리 공격 등 톤 조정
- 현재 적만 참조하라. 이전 웨이브의 적을 절대 언급하지 마라`;

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
  templateEnemy?: { name: string; description: string },
): string {
  let msg = `웨이브: ${waveNumber} / ${maxWaves}\n\n파티:\n${formatParty(players)}`;
  if (templateEnemy) {
    msg += `\n\n이번 웨이브의 적: ${templateEnemy.name} — ${templateEnemy.description}`;
  }
  if (previousSummary) {
    msg += `\n\n이전 웨이브 요약: ${previousSummary}`;
  }
  return msg;
}

export function buildNarrativeMessage(
  situation: string,
  enemyName: string,
  actions: PlayerAction[],
  enemyDefeated?: boolean,
): string {
  const actionLines = actions
    .map(
      (a) =>
        `- ${a.playerName}: "${a.choiceText}" → d20: ${a.roll}+${a.bonus}=${a.effectiveRoll} vs DC${a.dc} (${TIER_LABELS[a.tier] ?? a.tier})`,
    )
    .join('\n');

  const defeatLine = enemyDefeated
    ? `\n\n결과: ${enemyName} 처치 완료. 적의 최후를 짧게 묘사하라.`
    : `\n\n결과: ${enemyName} 생존. 전투가 계속된다.`;

  return `상황: ${situation}\n현재 적: ${enemyName} (이 적만 서술하라)\n\n행동 결과:\n${actionLines}${defeatLine}`;
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
  let msg = `상황: ${situation}\n현재 적: ${enemyName} (HP: ${hpRatio}%) (이 적에 대한 선택지만 생성하라)\n전투 라운드: ${combatRound}\n\n파티:\n${formatParty(players)}`;
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
