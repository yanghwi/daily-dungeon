import { create } from 'zustand';
import type { Player, Room, PlayerClass, CombatOutcome, TileContent, Position } from '@daily-dungeon/shared';

type GameState = 'home' | 'lobby' | 'playing';

interface CombatState {
  isActive: boolean;
  outcome: CombatOutcome | null;
}

interface GameStore {
  // 연결 상태
  connected: boolean;
  setConnected: (connected: boolean) => void;

  // 플레이어
  player: Player | null;
  setPlayer: (player: Player | null) => void;

  // 방
  room: Room | null;
  setRoom: (room: Room | null | ((prev: Room | null) => Room | null)) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;

  // 게임 상태
  gameState: GameState;
  setGameState: (state: GameState) => void;

  // 전투 상태
  combat: CombatState;
  setCombatActive: (isActive: boolean, outcome?: CombatOutcome | null) => void;
  clearCombat: () => void;

  // 플레이어 업데이트 (전투 후)
  updatePlayers: (players: Player[]) => void;

  // 던전 타일 업데이트 (전투 후 몬스터 제거, 아이템 드랍)
  updateDungeonTile: (position: Position, content: TileContent | null) => void;

  // 에러
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected }),

  player: null,
  setPlayer: (player) => set({ player }),

  room: null,
  setRoom: (room) =>
    set((state) => ({
      room: typeof room === 'function' ? room(state.room) : room,
    })),
  addPlayer: (player) =>
    set((state) => ({
      room: state.room
        ? { ...state.room, players: [...state.room.players, player] }
        : null,
    })),
  removePlayer: (playerId) =>
    set((state) => ({
      room: state.room
        ? {
            ...state.room,
            players: state.room.players.filter((p) => p.id !== playerId),
          }
        : null,
    })),

  gameState: 'home',
  setGameState: (gameState) => set({ gameState }),

  // 전투 상태
  combat: { isActive: false, outcome: null },
  setCombatActive: (isActive, outcome = null) =>
    set({ combat: { isActive, outcome } }),
  clearCombat: () => set({ combat: { isActive: false, outcome: null } }),

  // 플레이어 업데이트
  updatePlayers: (players) =>
    set((state) => {
      if (!state.room) return state;

      // 자신의 플레이어도 업데이트
      const updatedPlayer = players.find((p) => p.id === state.player?.id);

      return {
        room: { ...state.room, players },
        player: updatedPlayer || state.player,
      };
    }),

  // 던전 타일 업데이트
  updateDungeonTile: (position, content) =>
    set((state) => {
      if (!state.room?.dungeon) return state;

      const { x, y } = position;
      const newTiles = state.room.dungeon.tiles.map((row, rowY) =>
        rowY === y
          ? row.map((tile, colX) =>
              colX === x ? { ...tile, content } : tile
            )
          : row
      );

      return {
        room: {
          ...state.room,
          dungeon: {
            ...state.room.dungeon,
            tiles: newTiles,
          },
        },
      };
    }),

  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
