import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1024;
const TIMEOUT_MS = 15000;

let client: Anthropic | null = null;

/**
 * Anthropic 클라이언트 반환. API 키 없으면 null (→ 폴백 트리거)
 */
function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  if (!client) {
    client = new Anthropic({ apiKey, timeout: TIMEOUT_MS });
  }
  return client;
}

/**
 * Claude API 호출 → JSON 파싱. 실패 시 null 반환.
 */
export async function callClaude<T>(
  systemPrompt: string,
  userMessage: string,
): Promise<T | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // JSON 블록 추출 (```json ... ``` 또는 raw JSON)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      console.warn('[AI] JSON 파싱 실패 - 응답에서 JSON을 찾을 수 없음');
      return null;
    }

    return JSON.parse(jsonMatch[1]) as T;
  } catch (error) {
    console.warn('[AI] Claude API 호출 실패:', error instanceof Error ? error.message : error);
    return null;
  }
}
