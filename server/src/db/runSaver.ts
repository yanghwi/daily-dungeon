import { prisma } from './client.js';
import type { Character } from '@round-midnight/shared';
import { checkAndGrantUnlocks } from '../game/progression/unlockChecker.js';

interface SaveRunParams {
  roomCode: string;
  result: 'retreat' | 'wipe' | 'clear';
  wavesCleared: number;
  highlights: string[];
  dailySeedId?: string;
  players: Character[];
}

export interface SaveRunResponse {
  newUnlocks: Map<string, string[]>; // userId → 새 해금 ID[]
}

export async function saveRunResult(params: SaveRunParams): Promise<SaveRunResponse> {
  const { roomCode, result, wavesCleared, highlights, dailySeedId, players } = params;

  const response: SaveRunResponse = { newUnlocks: new Map() };

  if (!prisma) return response;

  // userId가 있는 플레이어만 DB에 저장 (비로그인 유저는 건너뜀)
  const loggedInPlayers = players.filter((p) => p.userId);
  if (loggedInPlayers.length === 0) return response;

  await prisma.runResult.create({
    data: {
      roomCode,
      result,
      wavesCleared,
      highlights: highlights as any,
      dailySeedId: dailySeedId ?? null,
      participants: {
        create: loggedInPlayers.map((p) => ({
          userId: p.userId!,
          characterName: p.name,
          background: p.background,
          survived: p.isAlive,
          damageDealt: 0,
          damageTaken: p.maxHp - p.hp,
        })),
      },
    },
  });

  // 해금 체크
  for (const player of loggedInPlayers) {
    const newUnlocks = await checkAndGrantUnlocks(player.userId!);
    if (newUnlocks.length > 0) {
      response.newUnlocks.set(player.userId!, newUnlocks);
    }
  }

  return response;
}
