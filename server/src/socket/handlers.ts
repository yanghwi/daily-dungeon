import { Server, Socket } from 'socket.io';
import { roomManager } from '../game/Room.js';
import { createCharacter, applyBackground } from '../game/Player.js';
import { WaveManager } from '../game/WaveManager.js';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  CharacterSetupPayload,
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

/** 방별 WaveManager 인스턴스 */
const waveManagers: Map<string, WaveManager> = new Map();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // ===== 로비 =====

    // 방 생성
    socket.on(SOCKET_EVENTS.CREATE_ROOM, (payload: CreateRoomPayload) => {
      const character = createCharacter(socket.id, payload.playerName);
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

      console.log(`Room created: ${room.code} by ${character.name} (mode: ${room.mode})`);
    });

    // 방 참가
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (payload: JoinRoomPayload) => {
      const character = createCharacter(socket.id, payload.playerName);
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

      console.log(`${character.name} joined room ${room.code}`);
    });

    // ===== 캐릭터 설정 =====

    // 게임 시작 (호스트) → 캐릭터 설정 단계로 전환
    socket.on(SOCKET_EVENTS.START_GAME, () => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room) return;

      const player = room.players.find((p: Character) => p.socketId === socket.id);
      if (!player) return;

      const updatedRoom = roomManager.startCharacterSetup(room.code, player.id);
      if (!updatedRoom) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: '게임을 시작할 수 없습니다.' });
        return;
      }

      io.to(room.code).emit(SOCKET_EVENTS.GAME_STARTED, { room: updatedRoom });
      console.log(`Character setup started in room ${room.code}`);
    });

    // 캐릭터 배경 선택
    socket.on(SOCKET_EVENTS.CHARACTER_SETUP, (payload: CharacterSetupPayload) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room || room.phase !== 'character_setup') return;

      const player = room.players.find((p: Character) => p.socketId === socket.id);
      if (!player) return;

      // 이름 업데이트 + 배경 적용
      player.name = payload.name || player.name;
      const updatedCharacter = applyBackground(player, payload.background);
      updatedCharacter.socketId = socket.id; // socketId 유지

      const updatedRoom = roomManager.updateCharacter(room.code, updatedCharacter);
      if (!updatedRoom) return;

      // 설정 완료 알림
      io.to(room.code).emit(SOCKET_EVENTS.CHARACTER_READY, {
        player: updatedCharacter,
        room: updatedRoom,
      });

      console.log(`${updatedCharacter.name} selected: ${payload.background}`);

      // 전원 준비 완료 체크
      if (roomManager.isAllCharactersReady(room.code)) {
        const gameRoom = roomManager.startGame(room.code);
        if (gameRoom) {
          io.to(room.code).emit(SOCKET_EVENTS.ALL_CHARACTERS_READY, { room: gameRoom });
          console.log(`All characters ready in room ${room.code}, game starting!`);

          // WaveManager 생성 + 첫 웨이브 시작
          const wm = new WaveManager(room.code, io);
          waveManagers.set(room.code, wm);
          wm.startWave(gameRoom).catch((err) => console.error('[handlers] startWave 에러:', err));
        }
      }
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

    // 계속/철수 투표
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

    // 아이템 장착
    socket.on(SOCKET_EVENTS.EQUIP_ITEM, (payload: EquipItemPayload) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room || room.phase !== 'maintenance') return;

      const player = room.players.find((p: Character) => p.socketId === socket.id);
      if (!player) return;

      const updated = equipItem(player, payload.itemId);
      const updatedRoom = roomManager.updateCharacter(room.code, updated);
      if (!updatedRoom) return;

      socket.emit(SOCKET_EVENTS.INVENTORY_UPDATED, {
        inventory: toDisplayInventory(updated.inventory),
        equipment: updated.equipment,
        hp: updated.hp,
        maxHp: updated.maxHp,
        activeBuffs: updated.activeBuffs,
      });
    });

    // 아이템 장착 해제
    socket.on(SOCKET_EVENTS.UNEQUIP_ITEM, (payload: UnequipItemPayload) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room || room.phase !== 'maintenance') return;

      const player = room.players.find((p: Character) => p.socketId === socket.id);
      if (!player) return;

      const updated = unequipItem(player, payload.itemId);
      const updatedRoom = roomManager.updateCharacter(room.code, updated);
      if (!updatedRoom) return;

      socket.emit(SOCKET_EVENTS.INVENTORY_UPDATED, {
        inventory: toDisplayInventory(updated.inventory),
        equipment: updated.equipment,
        hp: updated.hp,
        maxHp: updated.maxHp,
        activeBuffs: updated.activeBuffs,
      });
    });

    // 소모품 사용
    socket.on(SOCKET_EVENTS.USE_CONSUMABLE, (payload: UseConsumablePayload) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room || room.phase !== 'maintenance') return;

      const player = room.players.find((p: Character) => p.socketId === socket.id);
      if (!player) return;

      const updated = useConsumable(player, payload.itemId);
      const updatedRoom = roomManager.updateCharacter(room.code, updated);
      if (!updatedRoom) return;

      socket.emit(SOCKET_EVENTS.INVENTORY_UPDATED, {
        inventory: toDisplayInventory(updated.inventory),
        equipment: updated.equipment,
        hp: updated.hp,
        maxHp: updated.maxHp,
        activeBuffs: updated.activeBuffs,
      });

      // 파티원 전체에게 HP 변경 알림
      const partyStatus = updatedRoom.players.map((p: Character) => ({
        playerId: p.id,
        name: p.name,
        hp: p.hp,
        maxHp: p.maxHp,
      }));
      io.to(room.code).emit(SOCKET_EVENTS.PHASE_CHANGE, { phase: 'maintenance', partyStatus });
    });

    // 아이템 버리기
    socket.on(SOCKET_EVENTS.DISCARD_ITEM, (payload: DiscardItemPayload) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room || room.phase !== 'maintenance') return;

      const player = room.players.find((p: Character) => p.socketId === socket.id);
      if (!player) return;

      const updated = discardItem(player, payload.itemId);
      const updatedRoom = roomManager.updateCharacter(room.code, updated);
      if (!updatedRoom) return;

      socket.emit(SOCKET_EVENTS.INVENTORY_UPDATED, {
        inventory: toDisplayInventory(updated.inventory),
        equipment: updated.equipment,
        hp: updated.hp,
        maxHp: updated.maxHp,
        activeBuffs: updated.activeBuffs,
      });
    });

    // ===== 재접속 =====

    socket.on(SOCKET_EVENTS.RECONNECT_ATTEMPT, (payload: { playerId: string }) => {
      const { playerId } = payload;
      if (!playerId) {
        socket.emit(SOCKET_EVENTS.RECONNECT_FAILED, {});
        return;
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

      console.log(`Player ${player.name} reconnected to room ${room.code}`);
    });

    // ===== 연결 관리 =====

    // 방 나가기
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, () => {
      handleDisconnect(socket, io);
    });

    // 연결 해제
    socket.on('disconnect', () => {
      handleDisconnect(socket, io);
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

function handleDisconnect(socket: Socket, io: Server) {
  const room = roomManager.getPlayerRoom(socket.id);
  const result = roomManager.removePlayerBySocketId(socket.id);

  if (result) {
    io.to(result.room.code).emit(SOCKET_EVENTS.PLAYER_LEFT, {
      playerId: result.playerId,
      room: result.room,
    });

    // 방에 아무도 없으면 WaveManager 정리
    if (result.room.players.length === 0) {
      const wm = waveManagers.get(result.room.code);
      if (wm) {
        wm.cleanup();
        waveManagers.delete(result.room.code);
      }
    }
  }
}
