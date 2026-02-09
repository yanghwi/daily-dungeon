import { Server, Socket } from 'socket.io';
import { roomManager } from '../game/Room.js';
import { createCharacter, applyBackground, getUserLevel, getFixedCharacterByUserId } from '../game/Player.js';
import { WaveManager } from '../game/WaveManager.js';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  PlayerChoicePayload,
  ContinueOrRetreatPayload,
  EquipItemPayload,
  UnequipItemPayload,
  UseConsumablePayload,
  DiscardItemPayload,
  Character,
} from '@round-midnight/shared';
import { SOCKET_EVENTS } from '@round-midnight/shared';
import { equipItem, unequipItem, useConsumable, discardItem, toDisplayInventory } from '../game/InventoryManager.js';
import { getActiveSynergies } from '../game/SynergyResolver.js';
import { getUnlockedPassives } from '../game/progression/unlockChecker.js';
import { saveRunResult } from '../db/runSaver.js';

/** 방별 WaveManager 인스턴스 */
const waveManagers: Map<string, WaveManager> = new Map();

/** 연결 끊김 유예 타이머 (playerId → timer info) */
const disconnectTimers: Map<string, { timer: NodeJS.Timeout; roomCode: string }> = new Map();
const DISCONNECT_GRACE_MS = 30_000; // 30초

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // ===== 로비 =====

    // 방 생성
    socket.on(SOCKET_EVENTS.CREATE_ROOM, async (payload: CreateRoomPayload) => {
      // DB에서 레벨 + 패시브 조회 (비로그인 시 기본값)
      let level = 1;
      let passives: import('@round-midnight/shared').ItemEffect[] = [];
      if (payload.userId) {
        [level, passives] = await Promise.all([
          getUserLevel(payload.userId).catch(() => 1),
          getUnlockedPassives(payload.userId).catch(() => []),
        ]);
      }

      const character = createCharacter(socket.id, payload.playerName, payload.userId, level, passives);
      const room = roomManager.createRoom(character, {
        mode: payload.mode ?? 'custom',
        dailySeedId: payload.dailySeedId,
        seed: payload.seed,
      });

      socket.join(room.code);

      socket.emit(SOCKET_EVENTS.ROOM_CREATED, {
        roomCode: room.code,
        player: character,
      });

      console.log(`Room created: ${room.code} by ${character.name} (mode: ${room.mode}, lv: ${level})`);
    });

    // 방 참가
    socket.on(SOCKET_EVENTS.JOIN_ROOM, async (payload: JoinRoomPayload) => {
      // DB에서 레벨 + 패시브 조회
      let level = 1;
      let passives: import('@round-midnight/shared').ItemEffect[] = [];
      if (payload.userId) {
        [level, passives] = await Promise.all([
          getUserLevel(payload.userId).catch(() => 1),
          getUnlockedPassives(payload.userId).catch(() => []),
        ]);
      }

      const character = createCharacter(socket.id, payload.playerName, payload.userId, level, passives);
      const room = roomManager.joinRoom(payload.roomCode, character);

      if (!room) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: '방을 찾을 수 없거나 참가할 수 없습니다.' });
        return;
      }

      socket.join(room.code);

      socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
        room,
        player: character,
      });

      // 다른 플레이어들에게 알림
      socket.to(room.code).emit(SOCKET_EVENTS.PLAYER_JOINED, { player: character, room });

      console.log(`${character.name} joined room ${room.code} (lv: ${level})`);
    });

    // ===== 게임 시작 =====

    // 게임 시작 (호스트) → 고정 배경 자동 적용 → 즉시 wave_intro 진입
    socket.on(SOCKET_EVENTS.START_GAME, async () => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room) return;

      const player = room.players.find((p: Character) => p.socketId === socket.id);
      if (!player) return;

      // 호스트/인원 체크
      if (room.hostId !== player.id || room.phase !== 'waiting') {
        socket.emit(SOCKET_EVENTS.ERROR, { message: '게임을 시작할 수 없습니다.' });
        return;
      }

      // 각 플레이어에 고정 배경 자동 적용
      for (const p of room.players) {
        if (p.userId) {
          const fixed = await getFixedCharacterByUserId(p.userId);
          if (fixed) {
            const updated = applyBackground(p, fixed.background);
            updated.socketId = p.socketId;
            roomManager.updateCharacter(room.code, updated);
          }
        }
      }

      // character_setup 스킵 → 직접 startGame 호출을 위해 phase를 임시 전환
      const gameRoom = roomManager.startGameDirect(room.code);
      if (!gameRoom) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: '게임을 시작할 수 없습니다.' });
        return;
      }

      io.to(room.code).emit(SOCKET_EVENTS.GAME_STARTED, { room: gameRoom });
      console.log(`Game started directly in room ${room.code} (skipped character_setup)`);

      // WaveManager 생성 + 첫 웨이브 시작
      const wm = new WaveManager(room.code, io);
      waveManagers.set(room.code, wm);
      wm.startWave(gameRoom).catch((err) => console.error('[handlers] startWave 에러:', err));
    });

    // ===== 전투 =====

    // 선택지 선택
    socket.on(SOCKET_EVENTS.PLAYER_CHOICE, (payload: PlayerChoicePayload) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room || room.phase !== 'choosing') return;

      const player = room.players.find((p: Character) => p.socketId === socket.id);
      if (!player) return;

      const wm = waveManagers.get(room.code);
      if (!wm) return;

      wm.handlePlayerChoice(player.id, payload.choiceId, room);
    });

    // 주사위 굴림
    socket.on(SOCKET_EVENTS.DICE_ROLL, () => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room || room.phase !== 'rolling') return;

      const player = room.players.find((p: Character) => p.socketId === socket.id);
      if (!player) return;

      const wm = waveManagers.get(room.code);
      if (!wm) return;

      wm.handleDiceRoll(player.id, room);
    });

    // 준비 완료 투표
    socket.on(SOCKET_EVENTS.CONTINUE_OR_RETREAT, (payload: ContinueOrRetreatPayload) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room || room.phase !== 'maintenance') return;

      const player = room.players.find((p: Character) => p.socketId === socket.id);
      if (!player) return;

      const wm = waveManagers.get(room.code);
      if (!wm) return;

      wm.handleVote(player.id, payload.decision, room);
    });

    // ===== 아이템/인벤토리 =====

    /** 정비 중 인벤토리 변경 공통 처리 */
    const handleInventoryAction = (
      actionFn: (player: Character, itemId: string) => Character,
      itemId: string,
      broadcastHp?: boolean,
    ) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room || room.phase !== 'maintenance') return;

      const player = room.players.find((p: Character) => p.socketId === socket.id);
      if (!player) return;

      const updated = actionFn(player, itemId);
      const updatedRoom = roomManager.updateCharacter(room.code, updated);
      if (!updatedRoom) return;

      socket.emit(SOCKET_EVENTS.INVENTORY_UPDATED, {
        inventory: toDisplayInventory(updated.inventory),
        equipment: updated.equipment,
        hp: updated.hp,
        maxHp: updated.maxHp,
        activeBuffs: updated.activeBuffs,
        activeSynergies: getActiveSynergies(updated),
      });

      if (broadcastHp) {
        const partyStatus = updatedRoom.players.map((p: Character) => ({
          playerId: p.id,
          name: p.name,
          hp: p.hp,
          maxHp: p.maxHp,
        }));
        io.to(room.code).emit(SOCKET_EVENTS.PHASE_CHANGE, { phase: 'maintenance', partyStatus });
      }
    };

    socket.on(SOCKET_EVENTS.EQUIP_ITEM, (payload: EquipItemPayload) => {
      handleInventoryAction(equipItem, payload.itemId);
    });

    socket.on(SOCKET_EVENTS.UNEQUIP_ITEM, (payload: UnequipItemPayload) => {
      handleInventoryAction(unequipItem, payload.itemId);
    });

    socket.on(SOCKET_EVENTS.USE_CONSUMABLE, (payload: UseConsumablePayload) => {
      handleInventoryAction(useConsumable, payload.itemId, true);
    });

    socket.on(SOCKET_EVENTS.DISCARD_ITEM, (payload: DiscardItemPayload) => {
      handleInventoryAction(discardItem, payload.itemId);
    });

    // ===== 재접속 =====

    socket.on(SOCKET_EVENTS.RECONNECT_ATTEMPT, (payload: { playerId: string }) => {
      const { playerId } = payload;
      if (!playerId) {
        socket.emit(SOCKET_EVENTS.RECONNECT_FAILED, {});
        return;
      }

      // 유예 타이머가 있으면 취소
      const pending = disconnectTimers.get(playerId);
      if (pending) {
        clearTimeout(pending.timer);
        disconnectTimers.delete(playerId);
        console.log(`[reconnect] Cancelled disconnect timer for ${playerId}`);
      }

      // playerId로 방 찾기
      const room = roomManager.findRoomByPlayerId(playerId);
      if (!room) {
        socket.emit(SOCKET_EVENTS.RECONNECT_FAILED, {});
        return;
      }

      // socketId 교체
      const player = room.players.find((p: Character) => p.id === playerId);
      if (!player) {
        socket.emit(SOCKET_EVENTS.RECONNECT_FAILED, {});
        return;
      }

      player.socketId = socket.id;
      socket.join(room.code);

      socket.emit(SOCKET_EVENTS.RECONNECT_SUCCESS, {
        room,
        player,
        phase: room.phase,
      });

      console.log(`[reconnect] Player ${player.name} reconnected to room ${room.code} (phase: ${room.phase})`);
    });

    // ===== 연결 관리 =====

    // 방 나가기 (의도적 퇴장 → 즉시 제거)
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, () => {
      removePlayerImmediate(socket, io);
    });

    // 연결 해제 (브라우저 닫기/새로고침 → 유예 시간)
    socket.on('disconnect', () => {
      handleDisconnect(socket, io);
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * 의도적 퇴장: 즉시 플레이어 제거
 */
function removePlayerImmediate(socket: Socket, io: Server) {
  const room = roomManager.getPlayerRoom(socket.id);
  const player = room?.players.find((p: Character) => p.socketId === socket.id);

  // 유예 타이머가 있었으면 취소
  if (player) {
    const pending = disconnectTimers.get(player.id);
    if (pending) {
      clearTimeout(pending.timer);
      disconnectTimers.delete(player.id);
    }
  }

  const result = roomManager.removePlayerBySocketId(socket.id);
  if (!result) return;

  io.to(result.room.code).emit(SOCKET_EVENTS.PLAYER_LEFT, {
    playerId: result.playerId,
    room: result.room,
  });

  // 방에 아무도 없으면 WaveManager 정리
  if (result.room.players.length === 0) {
    cleanupEmptyRoom(result.room.code);
  }
}

/**
 * 연결 끊김: 게임 진행 중이면 유예 시간, 아니면 즉시 제거
 */
function handleDisconnect(socket: Socket, io: Server) {
  const room = roomManager.getPlayerRoom(socket.id);
  if (!room) return;

  const player = room.players.find((p: Character) => p.socketId === socket.id);
  if (!player) return;

  // 게임 진행 중이 아니면 (로비/런 종료) 즉시 제거
  const activePhases: string[] = ['wave_intro', 'choosing', 'rolling', 'narrating', 'wave_result', 'maintenance'];
  if (!activePhases.includes(room.phase)) {
    removePlayerImmediate(socket, io);
    return;
  }

  // 게임 진행 중: socketId 비우고 유예 시간 시작
  console.log(`[disconnect] Player ${player.name} disconnected during ${room.phase}. Grace period: ${DISCONNECT_GRACE_MS / 1000}s`);
  player.socketId = '';

  const timer = setTimeout(() => {
    disconnectTimers.delete(player.id);
    handleDisconnectTimeout(io, room.code, player.id);
  }, DISCONNECT_GRACE_MS);

  disconnectTimers.set(player.id, { timer, roomCode: room.code });
}

/**
 * 유예 시간 만료: 플레이어 제거, 빈 방이면 런 저장 후 정리
 */
function handleDisconnectTimeout(io: Server, roomCode: string, playerId: string) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  const player = room.players.find((p: Character) => p.id === playerId);
  if (!player) return;

  // 이미 재접속했으면 무시
  if (player.socketId !== '') return;

  // 런이 이미 정상 종료됐으면 저장 없이 정리만
  const alreadyEnded = room.phase === 'run_end';

  console.log(`[disconnect] Grace period expired for ${player.name} in room ${roomCode}${alreadyEnded ? ' (run already ended)' : ''}`);

  // 아직 접속 중인 다른 플레이어가 있는지 확인
  const connectedOthers = room.players.filter((p: Character) => p.id !== playerId && p.socketId !== '');

  if (connectedOthers.length > 0) {
    // 다른 플레이어가 접속 중 → 이 플레이어만 제거, 게임 계속
    const result = roomManager.leaveRoom(roomCode, playerId);
    if (result) {
      io.to(roomCode).emit(SOCKET_EVENTS.PLAYER_LEFT, { playerId, room: result });
    }
    return;
  }

  // 접속 중인 플레이어 없음 → 런 저장 후 전체 정리
  // 런 데이터 캡처 (플레이어 제거 전)
  const runSnapshot = room.run ? {
    currentWave: room.run.currentWave,
    dailySeedId: room.run.dailySeedId,
    players: [...room.players],
  } : null;

  // 다른 disconnected 플레이어들의 타이머도 취소
  for (const p of room.players) {
    if (p.id === playerId) continue;
    const pending = disconnectTimers.get(p.id);
    if (pending) {
      clearTimeout(pending.timer);
      disconnectTimers.delete(p.id);
    }
  }

  // 런 결과 저장 (게임 진행 중이었고, 아직 종료되지 않았으면)
  if (runSnapshot && !alreadyEnded) {
    console.log(`[disconnect] All players gone. Saving run as wipe (wave ${runSnapshot.currentWave})`);
    saveRunResult({
      roomCode,
      result: 'wipe',
      wavesCleared: runSnapshot.currentWave,
      highlights: ['연결 끊김으로 인한 자동 종료'],
      dailySeedId: runSnapshot.dailySeedId,
      players: runSnapshot.players,
    }).catch((err) => console.error('[disconnect] Failed to save run:', err instanceof Error ? err.message : err));
  }

  // 모든 플레이어를 제거하여 방 삭제 (leaveRoom은 마지막 플레이어 제거 시 rooms Map에서 방 삭제)
  const playerIds = room.players.map((p: Character) => p.id);
  for (const pid of playerIds) {
    roomManager.leaveRoom(roomCode, pid);
  }

  cleanupEmptyRoom(roomCode);
}

/**
 * 빈 방 정리: WaveManager cleanup + 방 삭제
 */
function cleanupEmptyRoom(roomCode: string) {
  const wm = waveManagers.get(roomCode);
  if (wm) {
    wm.cleanup();
    waveManagers.delete(roomCode);
  }
}
