import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';
import type {
  RoomCreatedResponse,
  RoomJoinedResponse,
  Room,
  Character,
  RunPhase,
  RoomMode,
  WaveIntroPayload,
  AllChoicesReadyPayload,
  RollResultsPayload,
  WaveNarrativePayload,
  WaveEndPayload,
  RunEndPayload,
  InventoryUpdatedPayload,
  CombatChoicesPayload,
  MaintenanceStartPayload,
} from '@round-midnight/shared';
import { SOCKET_EVENTS } from '@round-midnight/shared';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? 'http://localhost:3000' : '');

if (import.meta.env.PROD && !SOCKET_URL) {
  console.error('[Round Midnight] VITE_SERVER_URL이 설정되지 않았습니다. 서버에 연결할 수 없습니다.');
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const {
    setPlayer,
    setRoom,
    setConnected,
    setError,
    setPhase,
    setWaveIntro,
    setCombatChoices,
    setMaintenanceStart,
    setAllActions,
    setNarrative,
    setWaveEnd,
    setRunEnd,
    setVoteStatus,
    setInventoryUpdate,
    resetGame,
  } = useGameStore();

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);

      // 재접속 시도: 이전 세션이 있으면 playerId로 복원 시도
      const savedPlayerId = localStorage.getItem('rm-player-id');
      const store = useGameStore.getState();
      if (savedPlayerId && store.phase !== 'waiting') {
        socket.emit(SOCKET_EVENTS.RECONNECT_ATTEMPT, { playerId: savedPlayerId });
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    // ===== 재접속 =====

    socket.on(SOCKET_EVENTS.RECONNECT_SUCCESS, (data: { room: Room; player: Character; phase: RunPhase }) => {
      setPlayer(data.player);
      setRoom(data.room);
      setPhase(data.phase);
      console.log('Reconnected successfully');
    });

    socket.on(SOCKET_EVENTS.RECONNECT_FAILED, () => {
      localStorage.removeItem('rm-player-id');
      resetGame();
    });

    // ===== 로비 =====

    socket.on(SOCKET_EVENTS.ROOM_CREATED, (data: RoomCreatedResponse & { mode?: RoomMode }) => {
      setPlayer(data.player);
      localStorage.setItem('rm-player-id', data.player.id);
      setRoom({
        code: data.roomCode,
        players: [data.player],
        hostId: data.player.id,
        run: null,
        phase: 'waiting',
        mode: data.mode ?? 'custom',
      });
      setPhase('waiting');
    });

    socket.on(SOCKET_EVENTS.ROOM_JOINED, (data: RoomJoinedResponse) => {
      setPlayer(data.player);
      localStorage.setItem('rm-player-id', data.player.id);
      setRoom(data.room);
      setPhase('waiting');
    });

    socket.on(SOCKET_EVENTS.PLAYER_JOINED, (data: { player: Character; room: Room }) => {
      setRoom(data.room);
    });

    socket.on(SOCKET_EVENTS.PLAYER_LEFT, (data: { playerId: string; room: Room }) => {
      setRoom(data.room);
    });

    // ===== 캐릭터 설정 =====

    socket.on(SOCKET_EVENTS.GAME_STARTED, (data: { room: Room }) => {
      setRoom(data.room);
      setPhase('character_setup');
    });

    socket.on(SOCKET_EVENTS.CHARACTER_READY, (data: { player: Character; room: Room }) => {
      setRoom(data.room);
      const store = useGameStore.getState();
      if (store.player?.id === data.player.id) {
        setPlayer(data.player);
      }
    });

    socket.on(SOCKET_EVENTS.ALL_CHARACTERS_READY, (data: { room: Room }) => {
      setRoom(data.room);
      setPhase('wave_intro');
    });

    // ===== 전투 =====

    socket.on(SOCKET_EVENTS.WAVE_INTRO, (data: WaveIntroPayload) => {
      const store = useGameStore.getState();
      const myChoices = data.playerChoices.find((pc) => pc.playerId === store.player?.id)
        ?? data.playerChoices[0];
      if (myChoices) {
        setWaveIntro(data.waveNumber, data.enemy, data.situation, myChoices);
      }
    });

    socket.on(SOCKET_EVENTS.COMBAT_CHOICES, (data: CombatChoicesPayload) => {
      const store = useGameStore.getState();
      const myChoices = data.playerChoices.find((pc) => pc.playerId === store.player?.id)
        ?? data.playerChoices[0];
      if (myChoices) {
        setCombatChoices(data.combatRound, myChoices);
      }
    });

    socket.on(SOCKET_EVENTS.MAINTENANCE_START, (data: MaintenanceStartPayload) => {
      setMaintenanceStart(data);
    });

    socket.on(SOCKET_EVENTS.PHASE_CHANGE, (data: { phase: RunPhase }) => {
      setPhase(data.phase);
    });

    socket.on(SOCKET_EVENTS.ALL_CHOICES_READY, (_data: AllChoicesReadyPayload) => {
      // phase는 PHASE_CHANGE 이벤트로 처리됨
    });

    socket.on(SOCKET_EVENTS.ROLL_RESULTS, (data: RollResultsPayload) => {
      setAllActions(data.actions);
    });

    socket.on(SOCKET_EVENTS.WAVE_NARRATIVE, (data: WaveNarrativePayload) => {
      setNarrative(data.narrative, data.damageResult, data.partyStatus, data.enemyHp);
    });

    socket.on(SOCKET_EVENTS.WAVE_END, (data: WaveEndPayload) => {
      setWaveEnd(data);
    });

    socket.on(SOCKET_EVENTS.VOTE_UPDATE, (data: { continueCount: number; retreatCount: number; total: number }) => {
      setVoteStatus(data);
    });

    socket.on(SOCKET_EVENTS.RUN_END, (data: RunEndPayload) => {
      setRunEnd(data);
    });

    // ===== 인벤토리 =====

    socket.on(SOCKET_EVENTS.INVENTORY_UPDATED, (data: InventoryUpdatedPayload) => {
      setInventoryUpdate(data);
    });

    // ===== 에러 =====

    socket.on(SOCKET_EVENTS.ERROR, (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ===== Emitters =====

  const createRoom = (playerName: string, mode?: RoomMode, dailySeedId?: string, seed?: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.CREATE_ROOM, { playerName, mode, dailySeedId, seed });
  };

  const joinRoom = (roomCode: string, playerName: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode, playerName });
  };

  const startGame = () => {
    socketRef.current?.emit(SOCKET_EVENTS.START_GAME);
  };

  const leaveRoom = () => {
    socketRef.current?.emit(SOCKET_EVENTS.LEAVE_ROOM);
    localStorage.removeItem('rm-player-id');
    resetGame();
  };

  const submitCharacterSetup = (name: string, background: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.CHARACTER_SETUP, { name, background });
  };

  const submitChoice = (choiceId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.PLAYER_CHOICE, { choiceId });
  };

  const rollDice = () => {
    socketRef.current?.emit(SOCKET_EVENTS.DICE_ROLL, {});
  };

  const voteContinueOrRetreat = (decision: 'continue' | 'retreat') => {
    socketRef.current?.emit(SOCKET_EVENTS.CONTINUE_OR_RETREAT, { decision });
  };

  const equipItem = (itemId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.EQUIP_ITEM, { itemId });
  };

  const unequipItem = (itemId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.UNEQUIP_ITEM, { itemId });
  };

  const useConsumable = (itemId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.USE_CONSUMABLE, { itemId });
  };

  const discardItem = (itemId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.DISCARD_ITEM, { itemId });
  };

  return {
    socket: socketRef.current,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
    submitCharacterSetup,
    submitChoice,
    rollDice,
    voteContinueOrRetreat,
    equipItem,
    unequipItem,
    useConsumable,
    discardItem,
  };
}
