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
  InventoryItemDisplay,
  Equipment,
  InventoryUpdatedPayload,
  TemporaryBuff,
} from '@round-midnight/shared';
import type { CharacterAppearance } from '../assets/sprites/characterParts';

// 인증 관련 타입
export interface AuthUser {
  id: string;
  displayName: string;
  pin: string;
  authProvider?: string;
  discordUsername?: string;
  level?: number;
  xp?: number;
  xpToNext?: number;
  totalRuns?: number;
}

// 캐릭터 설정 (허브에서 설정 → character_setup에서 자동제출)
export interface CharacterConfig {
  name: string;
  background: string;
  appearance: CharacterAppearance;
}

export interface RunHistoryEntry {
  runId: string;
  result: string;
  wavesCleared: number;
  totalWaves: number;
  highlights: unknown;
  isDaily: boolean;
  characterName: string;
  background: string;
  survived: boolean;
  damageDealt: number;
  damageTaken: number;
  createdAt: string;
}

interface GameStore {
  // 인증 상태
  authToken: string | null;
  authUser: AuthUser | null;
  runHistory: RunHistoryEntry[];
  setAuth: (token: string, user: AuthUser) => void;
  setRunHistory: (runs: RunHistoryEntry[]) => void;
  clearAuth: () => void;

  // 캐릭터 설정 (허브에서 영속)
  characterConfig: CharacterConfig | null;
  setCharacterConfig: (config: CharacterConfig) => void;

  // 솔로 자동시작 플래그
  pendingAction: 'solo_start' | null;
  setPendingAction: (action: 'solo_start' | null) => void;

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
  combatRound: number;
  enemy: Enemy | null;
  situation: string;
  myChoices: PlayerChoiceSet | null;
  mySelectedChoiceId: string | null;
  allActions: PlayerAction[] | null;
  narrative: string;
  damageResult: DamageResult | null;
  loot: LootItem[];

  // 웨이브 종료 상태
  partyStatus: WaveEndPayload['partyStatus'];
  hasVoted: boolean;
  nextWavePreview: string;
  voteStatus: { continueCount: number; retreatCount: number; total: number } | null;
  setVoteStatus: (status: { continueCount: number; retreatCount: number; total: number }) => void;

  // 인벤토리
  inventory: InventoryItemDisplay[];
  equipment: Equipment | null;
  activeBuffs: TemporaryBuff[];
  setInventoryUpdate: (payload: InventoryUpdatedPayload) => void;

  // 런 종료 상태
  runEndResult: RunEndPayload | null;

  // 전투 setter
  setWaveIntro: (wave: number, enemy: Enemy, situation: string, choices: PlayerChoiceSet) => void;
  setCombatChoices: (round: number, choices: PlayerChoiceSet) => void;
  setMaintenanceStart: (payload: { partyStatus: WaveEndPayload['partyStatus']; loot: LootItem[]; nextWavePreview?: string }) => void;
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
  // 인증 상태
  authToken: localStorage.getItem('rm-auth-token'),
  authUser: (() => {
    try {
      const stored = localStorage.getItem('rm-auth-user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  })(),
  runHistory: [],
  setAuth: (token, user) => {
    localStorage.setItem('rm-auth-token', token);
    localStorage.setItem('rm-auth-user', JSON.stringify(user));
    set({ authToken: token, authUser: user });
  },
  setRunHistory: (runs) => set({ runHistory: runs }),
  clearAuth: () => {
    localStorage.removeItem('rm-auth-token');
    localStorage.removeItem('rm-auth-user');
    set({ authToken: null, authUser: null, runHistory: [] });
  },

  // 캐릭터 설정 (localStorage 영속)
  characterConfig: (() => {
    try {
      const stored = localStorage.getItem('rm-character-config');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  })(),
  setCharacterConfig: (config) => {
    localStorage.setItem('rm-character-config', JSON.stringify(config));
    set({ characterConfig: config });
  },

  // 솔로 자동시작 플래그
  pendingAction: null,
  setPendingAction: (action) => set({ pendingAction: action }),

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
  combatRound: 0,
  enemy: null,
  situation: '',
  myChoices: null,
  mySelectedChoiceId: null,
  allActions: null,
  narrative: '',
  damageResult: null,
  loot: [],

  // 웨이브 종료 상태
  partyStatus: [],
  hasVoted: false,
  nextWavePreview: '',
  voteStatus: null,
  setVoteStatus: (status) => set({ voteStatus: status }),

  // 인벤토리
  inventory: [],
  equipment: null,
  activeBuffs: [],
  setInventoryUpdate: (payload) =>
    set((state) => ({
      inventory: payload.inventory,
      equipment: payload.equipment,
      activeBuffs: payload.activeBuffs ?? state.activeBuffs,
      player: state.player
        ? {
            ...state.player,
            inventory: payload.inventory,
            equipment: payload.equipment,
            hp: payload.hp,
            maxHp: payload.maxHp,
            activeBuffs: payload.activeBuffs ?? state.player.activeBuffs ?? [],
          }
        : null,
    })),

  // 런 종료 상태
  runEndResult: null,

  setWaveIntro: (currentWave, enemy, situation, myChoices) =>
    set({
      currentWave,
      combatRound: 1,
      enemy,
      situation,
      myChoices,
      mySelectedChoiceId: null,
      allActions: null,
      narrative: '',
      damageResult: null,
      loot: [],
      hasVoted: false,
      voteStatus: null,
    }),

  setCombatChoices: (round, myChoices) =>
    set({
      combatRound: round,
      myChoices,
      mySelectedChoiceId: null,
      allActions: null,
      narrative: '',
      damageResult: null,
    }),

  setMaintenanceStart: (payload) =>
    set({
      partyStatus: payload.partyStatus,
      loot: payload.loot,
      nextWavePreview: payload.nextWavePreview ?? '',
      hasVoted: false,
      voteStatus: null,
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
      partyStatus: payload.partyStatus,
      loot: payload.loot,
      nextWavePreview: payload.nextWavePreview ?? '',
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
      combatRound: 0,
      enemy: null,
      situation: '',
      myChoices: null,
      mySelectedChoiceId: null,
      allActions: null,
      narrative: '',
      damageResult: null,
      loot: [],
      partyStatus: [],
      hasVoted: false,
      nextWavePreview: '',
      voteStatus: null,
      inventory: [],
      equipment: null,
      activeBuffs: [],
      runEndResult: null,
      error: null,
    }),
}));
