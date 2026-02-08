import type { PlayerAction } from '@round-midnight/shared';
import { callClaude } from './client.js';
import { NARRATIVE_SYSTEM, buildNarrativeMessage } from './prompts.js';
import { buildNarrative as buildFallbackNarrative } from '../game/data/hardcodedData.js';

interface LLMNarrativeResponse {
  narrative: string;
}

/**
 * LLM으로 전투 내러티브 생성. 실패 시 하드코딩 템플릿 폴백.
 */
export async function generateNarrative(
  situation: string,
  enemyName: string,
  actions: PlayerAction[],
  enemyDefeated: boolean,
): Promise<string> {
  const userMessage = buildNarrativeMessage(situation, enemyName, actions, enemyDefeated);
  const llmResult = await callClaude<LLMNarrativeResponse>(NARRATIVE_SYSTEM, userMessage, 150);

  if (llmResult?.narrative) {
    console.log('[AI] 내러티브 생성 성공 (LLM)');
    return llmResult.narrative;
  }

  console.log('[AI] 내러티브 생성 폴백 (하드코딩)');
  return buildFallbackNarrative(actions, enemyName, enemyDefeated);
}
