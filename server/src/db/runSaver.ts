import { prisma } from './client.js';
import type { Character } from '@round-midnight/shared';
import { checkAndGrantUnlocks } from '../game/progression/unlockChecker.js';

interface SaveRunParams {
  roomCode: string;
  result: 'wipe' | 'clear';
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

  if (!prisma) {
    console.warn('[runSaver] prisma is null — skipping save');
    return response;
  }

  // userId가 있는 플레이어만 DB에 저장 (비로그인 유저는 건너뜀)
  const loggedInPlayers = players.filter((p) => p.userId);
  if (loggedInPlayers.length === 0) {
    console.warn('[runSaver] No logged-in players — skipping save', {
      playerCount: players.length,
      userIds: players.map((p) => p.userId ?? 'undefined'),
    });
    return response;
  }

  console.log('[runSaver] Saving run result:', {
    roomCode,
    result,
    wavesCleared,
    playerCount: loggedInPlayers.length,
    userIds: loggedInPlayers.map((p) => p.userId),
    dailySeedId: dailySeedId ?? 'none',
  });

  try {
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

    console.log('[runSaver] Run saved successfully');
  } catch (err) {
    console.error('[runSaver] Failed to save run:', err instanceof Error ? err.message : err);
    return response;
  }

  // 해금 체크
  for (const player of loggedInPlayers) {
    try {
      const newUnlocks = await checkAndGrantUnlocks(player.userId!);
      if (newUnlocks.length > 0) {
        response.newUnlocks.set(player.userId!, newUnlocks);
      }
    } catch (err) {
      console.error('[runSaver] Unlock check failed for', player.userId, err instanceof Error ? err.message : err);
    }
  }

  return response;
}
