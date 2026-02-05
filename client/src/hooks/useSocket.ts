import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';
import type {
  RoomCreatedResponse,
  RoomJoinedResponse,
  Room,
  Character,
  RunPhase,
  WaveIntroPayload,
  AllChoicesReadyPayload,
  RollResultsPayload,
  WaveNarrativePayload,
  WaveEndPayload,
  RunEndPayload,
} from '@round-midnight/shared';
import { SOCKET_EVENTS } from '@round-midnight/shared';

const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const {
    setPlayer,
    setRoom,
    setConnected,
    setError,
    setPhase,
    setWaveIntro,
    setAllActions,
    setNarrative,
    setWaveEnd,
    setRunEnd,
    resetGame,
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

    // ===== 로비 =====

    socket.on(SOCKET_EVENTS.ROOM_CREATED, (data: RoomCreatedResponse) => {
      setPlayer(data.player);
      setRoom({
        code: data.roomCode,
        players: [data.player],
        hostId: data.player.id,
        run: null,
        phase: 'waiting',
      });
      setPhase('waiting');
    });

    socket.on(SOCKET_EVENTS.ROOM_JOINED, (data: RoomJoinedResponse) => {
      setPlayer(data.player);
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
      setNarrative(data.narrative, data.damageResult);
    });

    socket.on(SOCKET_EVENTS.WAVE_END, (data: WaveEndPayload) => {
      setWaveEnd(data);
    });

    socket.on(SOCKET_EVENTS.RUN_END, (data: RunEndPayload) => {
      setRunEnd(data);
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

  const createRoom = (playerName: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.CREATE_ROOM, { playerName });
  };

  const joinRoom = (roomCode: string, playerName: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode, playerName });
  };

  const startGame = () => {
    socketRef.current?.emit(SOCKET_EVENTS.START_GAME);
  };

  const leaveRoom = () => {
    socketRef.current?.emit(SOCKET_EVENTS.LEAVE_ROOM);
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
  };
}
