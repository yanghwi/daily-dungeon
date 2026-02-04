import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';
import type {
  RoomCreatedResponse,
  RoomJoinedResponse,
  Room,
  Player,
  MapType,
  DungeonTile,
  Position,
  CombatResultResponse,
  PlayerDiedResponse,
} from '@daily-dungeon/shared';

const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const {
    setPlayer,
    setRoom,
    setConnected,
    setError,
    addPlayer,
    removePlayer,
    setGameState,
    setCombatActive,
    updatePlayers,
    updateDungeonTile,
  } = useGameStore();

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    // 방 생성 응답
    socket.on('room-created', (data: RoomCreatedResponse) => {
      setPlayer(data.player);
      setRoom({
        code: data.roomCode,
        players: [data.player],
        state: 'waiting',
        dungeon: null,
        hostId: data.player.id,
        mapType: 'goblin_cave',
      });
      setGameState('lobby');
    });

    // 방 참가 응답
    socket.on('room-joined', (data: RoomJoinedResponse) => {
      setPlayer(data.player);
      setRoom(data.room);
      setGameState('lobby');
    });

    // 새 플레이어 참가
    socket.on('player-joined', (data: { player: Player; room: Room }) => {
      setRoom(data.room);
    });

    // 플레이어 퇴장
    socket.on('player-left', (data: { playerId: string; room: Room }) => {
      setRoom(data.room);
    });

    // 게임 시작
    socket.on('game-started', (data: {
      players: Player[];
      mapType: string;
      dungeon: DungeonTile[][];
      spawnPoint: Position;
      portalPosition: Position;
    }) => {
      setRoom((prevRoom) =>
        prevRoom
          ? {
              ...prevRoom,
              state: 'playing',
              players: data.players,
              mapType: data.mapType as MapType,
              dungeon: {
                id: `dungeon-${prevRoom.code}`,
                mapType: data.mapType as MapType,
                theme: data.mapType,
                description: '',
                tiles: data.dungeon,
                width: data.dungeon[0]?.length || 0,
                height: data.dungeon.length,
                spawnPoint: data.spawnPoint,
                portalPosition: data.portalPosition,
              },
            }
          : null
      );
      setGameState('playing');
    });

    // 전투 결과
    socket.on('combat-result', (data: CombatResultResponse) => {
      console.log('[combat-result] Received:', data.outcome.result);
      setCombatActive(true, data.outcome);
      updatePlayers(data.updatedPlayers);

      // 전투 후 타일 업데이트 (몬스터 제거 또는 아이템 드랍)
      const { monsterPosition, drops } = data.outcome;
      if (monsterPosition) {
        // 드랍 아이템이 있으면 해당 타일에 아이템 배치, 없으면 빈 타일로
        const newContent = drops.length > 0
          ? { type: 'item' as const, item: drops[0] }
          : null;
        updateDungeonTile(monsterPosition, newContent);
      }
    });

    // 플레이어 사망
    socket.on('player-died', (data: PlayerDiedResponse) => {
      console.log('[player-died]', data.playerName);
      // 추가 UI 처리 필요 시 여기에 추가
    });

    // 에러 처리
    socket.on('join-error', (data: { message: string }) => {
      setError(data.message);
    });

    socket.on('start-error', (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = (playerName: string, playerClass: string) => {
    socketRef.current?.emit('create-room', { playerName, playerClass });
  };

  const joinRoom = (roomCode: string, playerName: string, playerClass: string) => {
    socketRef.current?.emit('join-room', { roomCode, playerName, playerClass });
  };

  const startGame = (mapType?: string) => {
    console.log('[startGame] Called, socket:', socketRef.current?.id, 'mapType:', mapType);
    socketRef.current?.emit('start-game', { mapType });
  };

  const leaveRoom = () => {
    socketRef.current?.emit('leave-room');
    setRoom(null);
    setPlayer(null);
    setGameState('home');
  };

  const encounterMonster = (monsterId: string, monsterPos: Position) => {
    console.log('[encounterMonster] Called:', monsterId, monsterPos);
    socketRef.current?.emit('encounter-monster', { monsterId, monsterPos });
  };

  return {
    socket: socketRef.current,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
    encounterMonster,
  };
}
