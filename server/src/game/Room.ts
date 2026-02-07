import type { Room, Character, RunState, RunPhase, RoomMode } from '@round-midnight/shared';
import { GAME_CONSTANTS } from '@round-midnight/shared';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  createRoom(host: Character, options?: { mode?: RoomMode; dailySeedId?: string; seed?: string }): Room {
    let code: string;
    do {
      code = generateRoomCode();
    } while (this.rooms.has(code));

    const room: Room = {
      code,
      players: [host],
      hostId: host.id,
      run: null,
      phase: 'waiting',
      mode: options?.mode ?? 'custom',
      dailySeedId: options?.dailySeedId,
      seed: options?.seed,
    };

    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  joinRoom(code: string, player: Character): Room | null {
    const room = this.getRoom(code);
    if (!room) return null;
    if (room.phase !== 'waiting') return null;
    if (room.players.length >= GAME_CONSTANTS.MAX_PLAYERS) return null;

    room.players.push(player);
    return room;
  }

  leaveRoom(code: string, playerId: string): Room | null {
    const room = this.getRoom(code);
    if (!room) return null;

    room.players = room.players.filter((p) => p.id !== playerId);

    if (room.players.length === 0) {
      this.rooms.delete(code);
      return null;
    }

    // 호스트가 나가면 다음 사람이 호스트
    if (room.hostId === playerId) {
      room.hostId = room.players[0].id;
    }

    return room;
  }

  /**
   * 캐릭터 설정 단계로 전환
   */
  startCharacterSetup(code: string, playerId: string): Room | null {
    const room = this.getRoom(code);
    if (!room) return null;
    if (room.hostId !== playerId) return null;
    if (room.players.length < GAME_CONSTANTS.MIN_PLAYERS) return null;
    if (room.phase !== 'waiting') return null;

    room.phase = 'character_setup';
    return room;
  }

  /**
   * 캐릭터 설정 완료 확인
   */
  isAllCharactersReady(code: string): boolean {
    const room = this.getRoom(code);
    if (!room) return false;
    return room.players.every((p) => p.background !== '');
  }

  /**
   * 캐릭터 업데이트
   */
  updateCharacter(code: string, character: Character): Room | null {
    const room = this.getRoom(code);
    if (!room) return null;

    const idx = room.players.findIndex((p) => p.id === character.id);
    if (idx !== -1) {
      room.players[idx] = character;
    }
    return room;
  }

  /**
   * 게임 시작 (캐릭터 설정 완료 후)
   */
  startGame(code: string): Room | null {
    const room = this.getRoom(code);
    if (!room) return null;
    if (room.phase !== 'character_setup') return null;
    if (!this.isAllCharactersReady(code)) return null;

    room.phase = 'wave_intro';

    room.run = {
      roomCode: code,
      players: [...room.players],
      currentWave: 1,
      maxWaves: GAME_CONSTANTS.MAX_WAVES,
      enemy: null,
      accumulatedLoot: [],
      phase: 'wave_intro',
      waveHistory: [],
      dailySeedId: room.dailySeedId,
      seed: room.seed,
    };

    return room;
  }

  /**
   * 방 phase 변경
   */
  setPhase(code: string, phase: RunPhase): void {
    const room = this.getRoom(code);
    if (!room) return;
    room.phase = phase;
    if (room.run) {
      room.run.phase = phase;
    }
  }

  /**
   * 다음 웨이브로 진행
   */
  advanceWave(code: string): RunState | null {
    const room = this.getRoom(code);
    if (!room || !room.run) return null;

    room.run.currentWave += 1;
    room.phase = 'wave_intro';
    room.run.phase = 'wave_intro';

    return room.run;
  }

  /**
   * 플레이어 상태 업데이트
   */
  updatePlayers(code: string, updatedPlayers: Character[]): void {
    const room = this.getRoom(code);
    if (!room) return;

    for (const updated of updatedPlayers) {
      const idx = room.players.findIndex((p) => p.id === updated.id);
      if (idx !== -1) {
        room.players[idx] = updated;
      }
    }
    if (room.run) {
      room.run.players = [...room.players];
    }
  }

  getPlayerRoom(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.some((p) => p.socketId === socketId)) {
        return room;
      }
    }
    return undefined;
  }

  /**
   * playerId로 방 찾기 (재접속용)
   */
  findRoomByPlayerId(playerId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.some((p) => p.id === playerId)) {
        return room;
      }
    }
    return undefined;
  }

  removePlayerBySocketId(socketId: string): { room: Room; playerId: string } | null {
    for (const room of this.rooms.values()) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) {
        const result = this.leaveRoom(room.code, player.id);
        return result ? { room: result, playerId: player.id } : null;
      }
    }
    return null;
  }

  /**
   * 런 종료
   */
  endRun(code: string): void {
    const room = this.getRoom(code);
    if (!room) return;
    room.phase = 'run_end';
    if (room.run) {
      room.run.phase = 'run_end';
    }
  }
}

export const roomManager = new RoomManager();
