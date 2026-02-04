import Anthropic from '@anthropic-ai/sdk';
import type { CombatOutcome, CombatResult, Player, Monster } from '@daily-dungeon/shared';

// 캐시 (동일 상황 재사용)
const narrativeCache = new Map<string, string>();
const CACHE_TTL = 1000 * 60 * 30; // 30분

interface CacheEntry {
  narrative: string;
  timestamp: number;
}

const cacheWithTTL = new Map<string, CacheEntry>();

// 캐시 키 생성
function createCacheKey(
  result: CombatResult,
  monsterName: string,
  participantCount: number
): string {
  return `${result}-${monsterName}-${participantCount}`;
}

// 캐시에서 가져오기
function getFromCache(key: string): string | null {
  const entry = cacheWithTTL.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cacheWithTTL.delete(key);
    return null;
  }

  return entry.narrative;
}

// 캐시에 저장
function setToCache(key: string, narrative: string): void {
  cacheWithTTL.set(key, {
    narrative,
    timestamp: Date.now(),
  });
}

// 결과별 기본 묘사 (API 실패 시 폴백)
const FALLBACK_NARRATIVES: Record<CombatResult, string[]> = {
  perfect: [
    '파티의 완벽한 협공! 적은 저항조차 하지 못했다.',
    '압도적인 전투력 차이로 순식간에 전투가 끝났다.',
    '적을 일격에 처치했다. 상처 하나 없는 완승이다.',
  ],
  victory: [
    '격렬한 전투 끝에 승리했다. 약간의 상처가 남았다.',
    '적의 저항이 만만치 않았지만 결국 쓰러뜨렸다.',
    '파티의 팀워크로 적을 물리쳤다.',
  ],
  narrow: [
    '아슬아슬한 승리! 파티원들이 상처를 입었다.',
    '간신히 적을 쓰러뜨렸다. 치료가 필요하다.',
    '위태로운 전투였지만 살아남았다.',
  ],
  defeat: [
    '적의 힘에 밀려 후퇴할 수밖에 없었다.',
    '전투에서 패배했다. 심각한 부상을 입었다.',
    '압도적인 적 앞에 무릎을 꿇었다.',
  ],
  wipe: [
    '파티가 전멸 위기에 처했다!',
    '적의 공격에 모두가 쓰러졌다.',
    '재앙적인 패배... 간신히 목숨만 건졌다.',
  ],
};

// 폴백 묘사 선택
function getFallbackNarrative(result: CombatResult): string {
  const narratives = FALLBACK_NARRATIVES[result];
  return narratives[Math.floor(Math.random() * narratives.length)];
}

// Claude API로 전투 묘사 생성
export async function generateCombatNarrative(
  outcome: CombatOutcome,
  participants: Player[]
): Promise<string> {
  const cacheKey = createCacheKey(
    outcome.result,
    outcome.monster.name,
    participants.length
  );

  // 캐시 확인
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  // API 키 확인
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set, using fallback narrative');
    return getFallbackNarrative(outcome.result);
  }

  try {
    const client = new Anthropic({ apiKey });

    const participantNames = participants.map((p) => `${p.name}(${p.class})`).join(', ');
    const resultText = {
      perfect: '완벽한 승리',
      victory: '승리',
      narrow: '아슬아슬한 승리',
      defeat: '패배',
      wipe: '전멸 위기',
    }[outcome.result];

    const damageInfo = outcome.damages
      .map((d) => {
        const player = participants.find((p) => p.id === d.playerId);
        return player ? `${player.name}: ${d.damage} 피해` : '';
      })
      .filter(Boolean)
      .join(', ');

    const prompt = `당신은 던전 크롤러 게임의 전투 해설자입니다.
다음 전투 상황을 짧고 박진감 있게 묘사해주세요. 한국어로 2-3문장으로 작성하세요.

몬스터: ${outcome.monster.name} (${outcome.monster.description})
파티원: ${participantNames}
전투 결과: ${resultText}
피해 현황: ${damageInfo || '피해 없음'}
${outcome.drops.length > 0 ? `획득 아이템: ${outcome.drops.map((d) => d.name).join(', ')}` : ''}

요구사항:
- 턴제 전투 형식으로 묘사 (예: "전사가 검을 휘둘렀다... 마법사의 주문이 작렬했다...")
- 결과에 맞는 분위기 (승리=긴장감 있는 액션, 패배=긴박한 위기감)
- 이모지나 특수문자 사용하지 않기
- 2-3문장으로 간결하게`;

    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const narrative = (message.content[0] as { type: 'text'; text: string }).text.trim();

    // 캐시에 저장
    setToCache(cacheKey, narrative);

    return narrative;
  } catch (error) {
    console.error('Failed to generate combat narrative:', error);
    return getFallbackNarrative(outcome.result);
  }
}

// 동기 버전 (폴백만 사용)
export function generateCombatNarrativeSync(result: CombatResult): string {
  return getFallbackNarrative(result);
}
