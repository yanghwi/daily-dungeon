import { Server, Socket } from 'socket.io';
import { roomManager } from '../game/Room.js';
import { createPlayer } from '../game/Player.js';
import { generateDungeon } from '../../../shared/dungeonGenerator.js';
import { resolveCombat, getParticipantsInRange } from '../game/Combat.js';
import { generateCombatNarrative } from '../ai/combatNarrator.js';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  StartGamePayload,
  PlayerMovePayload,
  RoomCreatedResponse,
  RoomJoinedResponse,
  Room,
  Position,
  Player,
  MapType,
  Monster,
  CombatResultResponse,
} from '@daily-dungeon/shared';

// 전투 중인 몬스터 추적 (중복 전투 방지)
const activeMonsters = new Set<string>();

interface EncounterMonsterPayload {
  monsterId: string;
  monsterPos: Position;
}

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // 방 생성
    socket.on('create-room', (payload: CreateRoomPayload) => {
      const player = createPlayer(socket.id, payload.playerName, payload.playerClass);
      const room = roomManager.createRoom(player);

      socket.join(room.code);

      const response: RoomCreatedResponse = {
        roomCode: room.code,
        player,
      };

      socket.emit('room-created', response);
      console.log(`Room created: ${room.code} by ${player.name}`);
    });

    // 방 참가
    socket.on('join-room', (payload: JoinRoomPayload) => {
      const player = createPlayer(socket.id, payload.playerName, payload.playerClass);
      const room = roomManager.joinRoom(payload.roomCode, player);

      if (!room) {
        socket.emit('join-error', { message: '방을 찾을 수 없거나 참가할 수 없습니다.' });
        return;
      }

      socket.join(room.code);

      const response: RoomJoinedResponse = {
        room,
        player,
      };

      socket.emit('room-joined', response);

      // 다른 플레이어들에게 알림
      socket.to(room.code).emit('player-joined', { player, room });

      console.log(`${player.name} joined room ${room.code}`);
    });

    // 게임 시작
    socket.on('start-game', (payload: StartGamePayload) => {
      console.log(`[start-game] Socket ${socket.id} requested game start`);

      const room = roomManager.getPlayerRoom(socket.id);
      if (!room) {
        console.log(`[start-game] No room found for socket ${socket.id}`);
        return;
      }

      const player = room.players.find((p: Player) => p.socketId === socket.id);
      if (!player) {
        console.log(`[start-game] No player found in room ${room.code} for socket ${socket.id}`);
        return;
      }

      console.log(`[start-game] Player ${player.name} (${player.id}) trying to start room ${room.code}`);
      console.log(`[start-game] Room state: hostId=${room.hostId}, players=${room.players.length}, state=${room.state}`);

      if (payload.mapType) {
        roomManager.setMapType(room.code, payload.mapType);
      }

      const startedRoom = roomManager.startGame(room.code, player.id);
      if (!startedRoom) {
        console.log(`[start-game] startGame returned null - hostId mismatch or not enough players`);
        socket.emit('start-error', { message: '게임을 시작할 수 없습니다. (호스트만 시작 가능, 최소 2명 필요)' });
        return;
      }

      // 서버에서 던전 생성
      const dungeon = generateDungeon(startedRoom.mapType as MapType);

      // room에 던전 데이터 저장
      startedRoom.dungeon = {
        id: `dungeon-${room.code}-${Date.now()}`,
        mapType: startedRoom.mapType,
        theme: startedRoom.mapType,
        description: '',
        tiles: dungeon.tiles,
        width: dungeon.tiles[0].length,
        height: dungeon.tiles.length,
        spawnPoint: dungeon.spawnPoint,
        portalPosition: dungeon.portalPosition,
      };

      // 모든 플레이어에게 게임 시작 알림 (동일한 던전 데이터 전송)
      io.to(room.code).emit('game-started', {
        dungeon: dungeon.tiles,
        spawnPoint: dungeon.spawnPoint,
        portalPosition: dungeon.portalPosition,
        players: startedRoom.players,
        mapType: startedRoom.mapType,
      });

      console.log(`Game started in room ${room.code}`);
    });

    // 플레이어 이동
    socket.on('player-move', (payload: PlayerMovePayload) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room || room.state !== 'playing') return;

      const player = room.players.find((p: Player) => p.socketId === socket.id);
      if (!player) return;

      // 플레이어 위치 업데이트
      player.position = payload.position;

      // 다른 플레이어들에게 위치 브로드캐스트
      socket.to(room.code).emit('positions-update', {
        positions: [{ playerId: player.id, position: payload.position }],
      });
    });

    // 몬스터 조우
    socket.on('encounter-monster', async (payload: EncounterMonsterPayload) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room || room.state !== 'playing' || !room.dungeon) return;

      const player = room.players.find((p: Player) => p.socketId === socket.id);
      if (!player || !player.isAlive) return;

      // 이미 전투 중인 몬스터인지 확인
      const monsterKey = `${room.code}-${payload.monsterId}`;
      if (activeMonsters.has(monsterKey)) {
        return; // 이미 전투 처리 중
      }
      activeMonsters.add(monsterKey);

      try {
        // 던전에서 몬스터 찾기
        const { tiles } = room.dungeon;
        const tile = tiles[payload.monsterPos.y]?.[payload.monsterPos.x];

        if (!tile || tile.content?.type !== 'monster') {
          activeMonsters.delete(monsterKey);
          return;
        }

        const monster = tile.content.monster;

        // 전투 판정
        const { outcome, updatedPlayers } = resolveCombat({
          allPlayers: room.players,
          monster,
          monsterPos: payload.monsterPos,
          mapType: room.mapType,
        });

        // 참전자 정보
        const participants = room.players.filter((p) =>
          outcome.participants.includes(p.id)
        );

        // AI 전투 묘사 생성
        try {
          outcome.description = await generateCombatNarrative(outcome, participants);
        } catch (err) {
          console.error('Failed to generate narrative:', err);
          outcome.description = '전투가 벌어졌다!';
        }

        // 플레이어 상태 업데이트
        for (const updated of updatedPlayers) {
          const idx = room.players.findIndex((p) => p.id === updated.id);
          if (idx !== -1) {
            room.players[idx] = updated;
          }
        }

        // 몬스터 제거 (타일에서)
        tile.content = null;

        // 드랍 아이템이 있으면 타일에 배치
        if (outcome.drops.length > 0) {
          tile.content = { type: 'item', item: outcome.drops[0] };
        }

        // 전투 결과 브로드캐스트
        const response: CombatResultResponse = {
          outcome,
          updatedPlayers: room.players,
        };

        io.to(room.code).emit('combat-result', response);

        // 사망한 플레이어 처리
        for (const p of room.players) {
          if (!p.isAlive) {
            io.to(room.code).emit('player-died', {
              playerId: p.id,
              playerName: p.name,
              droppedItems: p.inventory,
              position: p.position,
            });
          }
        }

        console.log(
          `Combat in room ${room.code}: ${monster.name} vs ${participants.length} players - ${outcome.result}`
        );
      } finally {
        // 전투 완료 후 잠금 해제
        setTimeout(() => {
          activeMonsters.delete(monsterKey);
        }, 500); // 0.5초 후 해제 (중복 방지)
      }
    });

    // 방 나가기
    socket.on('leave-room', () => {
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
  const result = roomManager.removePlayerBySocketId(socket.id);
  if (result) {
    io.to(result.room.code).emit('player-left', {
      playerId: result.playerId,
      room: result.room,
    });
  }
}
