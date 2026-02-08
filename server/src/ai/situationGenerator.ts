import type { Character, PlayerChoiceSet, Enemy, PlayerAction } from '@round-midnight/shared';
import { callClaude } from './client.js';
import { SITUATION_SYSTEM, COMBAT_CHOICES_SYSTEM, buildSituationMessage, buildCombatChoicesMessage } from './prompts.js';
import {
  WAVE_TEMPLATES,
  scaleEnemy,
  getWaveTemplateFromPool,
  type WaveTemplate,
} from '../game/data/hardcodedData.js';
import { SeededRandom } from '../game/DailyDungeon.js';
import type { ChoiceOption } from '@round-midnight/shared';

interface LLMSituationResponse {
  situation: string;
  enemy: {
    name: string;
    description: string;
    imageTag: string;
  };
  playerChoices: {
    playerId: string;
    options: { id: string; text: string; category: string; baseDC: number }[];
  }[];
}

export interface SituationResult {
  enemy: Enemy;
  situation: string;
  playerChoiceSets: Map<string, PlayerChoiceSet>;
  /** 선택된 웨이브 템플릿 (멀티라운드 폴백용) */
  selectedTemplate: WaveTemplate;
}

/**
 * LLM으로 상황/적/선택지 생성. 실패 시 하드코딩 폴백.
 * seed가 있으면 웨이브 풀에서 결정적으로 적 변형 선택 (데일리 모드)
 */
export async function generateSituation(
  waveNumber: number,
  maxWaves: number,
  alivePlayers: Character[],
  previousSummary?: string,
  seed?: string,
): Promise<SituationResult> {
  // 시드 기반 풀 선택 (비보스 웨이브에서 변형 적 등장)
  const rng = seed ? new SeededRandom(`${seed}-wave-${waveNumber}`) : undefined;
  const pick = rng ? <T>(arr: T[]) => rng.pick(arr) : undefined;
  const template = getWaveTemplateFromPool(waveNumber, pick);

  // LLM 시도 — 현재 웨이브의 적 정보를 명시적으로 전달
  const userMessage = buildSituationMessage(waveNumber, maxWaves, alivePlayers, previousSummary, {
    name: template.enemy.name,
    description: template.enemy.description,
  });
  const llmResult = await callClaude<LLMSituationResponse>(SITUATION_SYSTEM, userMessage);

  if (llmResult) {
    const parsed = parseLLMSituation(llmResult, template, alivePlayers, waveNumber);
    if (parsed) {
      console.log(`[AI] Wave ${waveNumber} 상황 생성 성공 (LLM) — 적: ${template.enemy.name}`);
      return parsed;
    }
  }

  // 폴백
  console.log(`[AI] Wave ${waveNumber} 상황 생성 폴백 (하드코딩) — 적: ${template.enemy.name}`);
  return buildFallback(template, alivePlayers);
}

/**
 * LLM 응답을 게임 데이터로 변환
 */
function parseLLMSituation(
  llm: LLMSituationResponse,
  template: WaveTemplate,
  players: Character[],
  waveNumber: number,
): SituationResult | null {
  try {
    // 보스 웨이브(5, 10)는 LLM이 적 정보를 변경할 수 없음
    const isBossWave = waveNumber % 5 === 0;

    // 적: LLM은 이름/설명만, 스탯은 서버가 스케일링
    const enemy = scaleEnemy(
      {
        ...template,
        enemy: {
          name: isBossWave ? template.enemy.name : (llm.enemy.name || template.enemy.name),
          description: isBossWave ? template.enemy.description : (llm.enemy.description || template.enemy.description),
          defense: template.enemy.defense,
          imageTag: isBossWave ? template.enemy.imageTag : (VALID_IMAGE_TAGS.has(llm.enemy.imageTag) ? llm.enemy.imageTag : template.enemy.imageTag),
        },
      },
      players.length,
    );

    // 선택지: LLM이 playerId 기반으로 생성
    const playerChoiceSets = new Map<string, PlayerChoiceSet>();

    for (const player of players) {
      const llmChoices = llm.playerChoices?.find((pc) => pc.playerId === player.id);

      if (llmChoices && llmChoices.options.length >= 2) {
        const options: ChoiceOption[] = llmChoices.options.map((opt, i) => ({
          id: opt.id || `${player.id}-choice-${i}`,
          text: opt.text,
          category: validateCategory(opt.category),
          baseDC: clampDC(opt.baseDC),
        }));
        playerChoiceSets.set(player.id, { playerId: player.id, options });
      } else {
        // 이 플레이어의 선택지가 LLM에서 누락 → 배경별 폴백
        playerChoiceSets.set(player.id, buildPlayerFallback(player, template));
      }
    }

    return {
      enemy,
      situation: llm.situation || template.situation,
      playerChoiceSets,
      selectedTemplate: template,
    };
  } catch {
    return null;
  }
}

function buildFallback(template: WaveTemplate, players: Character[]): SituationResult {
  const enemy = scaleEnemy(template, players.length);
  const playerChoiceSets = new Map<string, PlayerChoiceSet>();

  for (const player of players) {
    playerChoiceSets.set(player.id, buildPlayerFallback(player, template));
  }

  return { enemy, situation: template.situation, playerChoiceSets, selectedTemplate: template };
}

function buildPlayerFallback(player: Character, template: WaveTemplate, combatRound: number = 1): PlayerChoiceSet {
  const bgChoices = template.choicesByBackground[player.background] ?? template.defaultChoices;
  const options: ChoiceOption[] = bgChoices.map((c, i) => ({
    id: `${player.id}-r${combatRound}-${i}`,
    text: c.text,
    category: c.category,
    baseDC: c.baseDC,
  }));
  return { playerId: player.id, options };
}

interface LLMCombatChoicesResponse {
  playerChoices: {
    playerId: string;
    options: { id: string; text: string; category: string; baseDC: number }[];
  }[];
}

/**
 * 멀티라운드 전투: 선택지만 재생성 (상황/적은 기존 유지)
 * selectedTemplate이 있으면 해당 템플릿의 폴백 선택지 사용 (풀 시스템 호환)
 */
export async function generateCombatChoices(
  situation: string,
  enemy: Enemy,
  combatRound: number,
  waveNumber: number,
  alivePlayers: Character[],
  previousActions?: PlayerAction[],
  selectedTemplate?: WaveTemplate,
): Promise<Map<string, PlayerChoiceSet>> {
  const template = selectedTemplate ?? WAVE_TEMPLATES[Math.min(waveNumber - 1, WAVE_TEMPLATES.length - 1)];

  // LLM 시도
  const userMessage = buildCombatChoicesMessage(
    situation, enemy.name, enemy.hp, enemy.maxHp, combatRound, alivePlayers, previousActions,
  );
  const llmResult = await callClaude<LLMCombatChoicesResponse>(COMBAT_CHOICES_SYSTEM, userMessage);

  if (llmResult && llmResult.playerChoices) {
    const choiceSets = new Map<string, PlayerChoiceSet>();
    for (const player of alivePlayers) {
      const llmChoices = llmResult.playerChoices.find((pc) => pc.playerId === player.id);
      if (llmChoices && llmChoices.options.length >= 2) {
        const options: ChoiceOption[] = llmChoices.options.map((opt, i) => ({
          id: opt.id || `${player.id}-r${combatRound}-${i}`,
          text: opt.text,
          category: validateCategory(opt.category),
          baseDC: clampDC(opt.baseDC),
        }));
        choiceSets.set(player.id, { playerId: player.id, options });
      } else {
        choiceSets.set(player.id, buildPlayerFallback(player, template, combatRound));
      }
    }
    console.log(`[AI] Combat round ${combatRound} 선택지 생성 성공 (LLM)`);
    return choiceSets;
  }

  // 폴백: 하드코딩 선택지 셔플
  console.log(`[AI] Combat round ${combatRound} 선택지 생성 폴백 (하드코딩)`);
  const choiceSets = new Map<string, PlayerChoiceSet>();
  for (const player of alivePlayers) {
    choiceSets.set(player.id, buildPlayerFallback(player, template, combatRound));
  }
  return choiceSets;
}

const VALID_IMAGE_TAGS = new Set([
  'raccoon', 'vending-machine', 'shadow-cats', 'cleaning-robot', 'market-boss',
  'delivery-bike', 'mannequins', 'neon-ghost', 'antenna-monster', 'midnight-clock',
  // 변형 적
  'stray-dog', 'traffic-light', 'sewer-rats', 'shopping-cart',
  'food-cart', 'umbrella-ghost', 'broken-tv', 'electric-pole',
]);

const VALID_CATEGORIES = new Set(['physical', 'social', 'technical', 'defensive', 'creative']);

function validateCategory(cat: string): ChoiceOption['category'] {
  return VALID_CATEGORIES.has(cat) ? (cat as ChoiceOption['category']) : 'physical';
}

function clampDC(dc: number): number {
  return Math.max(8, Math.min(15, Math.round(dc)));
}
