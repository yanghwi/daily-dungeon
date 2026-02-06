import { create } from 'zustand';
import type {
  Character,
  Room,
  RunPhase,
  RunState,
  Enemy,
  PlayerChoiceSet,
  PlayerAction,
  DamageResult,
  LootItem,
  WaveEndPayload,
  RunEndPayload,
} from '@round-midnight/shared';

interface GameStore {
  // 연결 상태
  connected: boolean;
  setConnected: (connected: boolean) => void;

  // 플레이어
  player: Character | null;
  setPlayer: (player: Character | null) => void;

  // 방
  room: Room | null;
  setRoom: (room: Room | null) => void;

  // 게임 phase (UI 라우팅 기준)
  phase: RunPhase;
  setPhase: (phase: RunPhase) => void;

  // 런 상태
  run: RunState | null;
  setRun: (run: RunState | null) => void;

  // 전투 상태
  currentWave: number;
  enemy: Enemy | null;
  situation: string;
  myChoices: PlayerChoiceSet | null;
  mySelectedChoiceId: string | null;
  allActions: PlayerAction[] | null;
  narrative: string;
  damageResult: DamageResult | null;
  loot: LootItem[];

  // 웨이브 종료 상태
  canContinue: boolean;
  partyStatus: WaveEndPayload['partyStatus'];
  hasVoted: boolean;
  nextWavePreview: string;

  // 런 종료 상태
  runEndResult: RunEndPayload | null;

  // 전투 setter
  setWaveIntro: (wave: number, enemy: Enemy, situation: string, choices: PlayerChoiceSet) => void;
  setMyChoice: (choiceId: string) => void;
  setAllActions: (actions: PlayerAction[]) => void;
  setNarrative: (narrative: string, damageResult: DamageResult, partyStatus?: WaveEndPayload['partyStatus'], enemyHp?: number) => void;
  setLoot: (loot: LootItem[]) => void;
  setWaveEnd: (payload: WaveEndPayload) => void;
  setRunEnd: (payload: RunEndPayload) => void;
  setHasVoted: (voted: boolean) => void;

  // 에러
  error: string | null;
  setError: (error: string | null) => void;

  // 리셋
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected }),

  player: null,
  setPlayer: (player) => set({ player }),

  room: null,
  setRoom: (room) => set({ room }),

  phase: 'waiting',
  setPhase: (phase) => set({ phase }),

  run: null,
  setRun: (run) => set({ run }),

  // 전투 상태
  currentWave: 0,
  enemy: null,
  situation: '',
  myChoices: null,
  mySelectedChoiceId: null,
  allActions: null,
  narrative: '',
  damageResult: null,
  loot: [],

  // 웨이브 종료 상태
  canContinue: false,
  partyStatus: [],
  hasVoted: false,
  nextWavePreview: '',

  // 런 종료 상태
  runEndResult: null,

  setWaveIntro: (currentWave, enemy, situation, myChoices) =>
    set({
      currentWave,
      enemy,
      situation,
      myChoices,
      mySelectedChoiceId: null,
      allActions: null,
      narrative: '',
      damageResult: null,
      loot: [],
      hasVoted: false,
    }),

  setMyChoice: (choiceId) => set({ mySelectedChoiceId: choiceId }),

  setAllActions: (actions) => set({ allActions: actions }),

  setNarrative: (narrative, damageResult, partyStatus, enemyHp) =>
    set((state) => ({
      narrative,
      damageResult,
      partyStatus: partyStatus ?? state.partyStatus,
      enemy: state.enemy && enemyHp !== undefined
        ? { ...state.enemy, hp: enemyHp }
        : state.enemy,
    })),

  setLoot: (loot) => set({ loot }),

  setWaveEnd: (payload) =>
    set({
      canContinue: payload.canContinue,
      partyStatus: payload.partyStatus,
      loot: payload.loot,
      nextWavePreview: payload.nextWavePreview ?? '',
      hasVoted: false,
    }),

  setRunEnd: (payload) => set({ runEndResult: payload }),

  setHasVoted: (voted) => set({ hasVoted: voted }),

  error: null,
  setError: (error) => set({ error }),

  resetGame: () =>
    set({
      room: null,
      player: null,
      phase: 'waiting',
      run: null,
      currentWave: 0,
      enemy: null,
      situation: '',
      myChoices: null,
      mySelectedChoiceId: null,
      allActions: null,
      narrative: '',
      damageResult: null,
      loot: [],
      canContinue: false,
      partyStatus: [],
      hasVoted: false,
      nextWavePreview: '',
      runEndResult: null,
      error: null,
    }),
}));
