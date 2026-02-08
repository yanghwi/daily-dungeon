import type { Character } from '@round-midnight/shared';
import { callClaude } from './client.js';
import { HIGHLIGHTS_SYSTEM, buildHighlightsMessage } from './prompts.js';

interface LLMHighlightsResponse {
  highlights: string[];
}

const FALLBACK_HIGHLIGHTS: Record<string, string[]> = {
  clear: ['야시장의 주인을 물리쳤다!', '모두 무사히 살아남았다.', '오늘 밤은 승리의 야식이다!'],
  wipe: ['모두 쓰러졌다...', '야시장의 어둠이 모든 것을 삼켰다.', '다음엔... 더 잘할 수 있을 거야.'],
};

/**
 * LLM으로 런 종료 하이라이트 3줄 생성. 실패 시 하드코딩 폴백.
 */
export async function generateHighlights(
  result: 'wipe' | 'clear',
  players: Character[],
  waveCount: number,
): Promise<string[]> {
  const userMessage = buildHighlightsMessage(result, players, waveCount);
  const llmResult = await callClaude<LLMHighlightsResponse>(HIGHLIGHTS_SYSTEM, userMessage, 150);

  if (llmResult?.highlights && Array.isArray(llmResult.highlights) && llmResult.highlights.length >= 3) {
    console.log('[AI] 하이라이트 생성 성공 (LLM)');
    return llmResult.highlights.slice(0, 3);
  }

  console.log('[AI] 하이라이트 생성 폴백 (하드코딩)');
  return FALLBACK_HIGHLIGHTS[result] ?? FALLBACK_HIGHLIGHTS.wipe;
}
