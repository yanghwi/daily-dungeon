// ===== 기본 타입 =====

export interface Position {
  x: number;
  y: number;
}

export type PlayerClass = 'warrior' | 'mage' | 'cleric' | 'rogue';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable';

// ===== 플레이어 =====

export interface Player {
  id: string;
  socketId: string;
  name: string;
  class: PlayerClass;
  position: Position;
  
  hp: number;
  maxHp: number;
  combatPower: number;  // 장비 + 클래스 보정
  
  isAlive: boolean;
  hasEscaped: boolean;
  
  inventory: Item[];
  equipment: Equipment;
  
  // 열쇠
  keys: number;
}

export interface Equipment {
  weapon: Item | null;
  armor: Item | null;
  accessory: Item | null;
}

// ===== 아이템 =====

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  combatPower: number;  // 전투력 보정
  effect?: string;      // 특수 효과 설명
  description: string;
}

// ===== 몬스터 =====

export interface Monster {
  id: string;
  name: string;
  combatPower: number;
  description: string;
}

// ===== 던전 =====

export interface DungeonTile {
  x: number;
  y: number;
  type: 'floor' | 'wall' | 'door' | 'portal';
  explored: boolean;
  content: TileContent | null;
}

export type TileContent = 
  | { type: 'monster'; monster: Monster }
  | { type: 'item'; item: Item }
  | { type: 'event'; eventId: string }
  | { type: 'portal' };

export interface Dungeon {
  id: string;
  mapType: MapType;
  theme: string;
  description: string;
  tiles: DungeonTile[][];
  width: number;
  height: number;
  spawnPoint: Position;
  portalPosition: Position;
}

export type MapType = 'goblin_cave' | 'abandoned_mine' | 'ancient_temple' | 'abyss';

// ===== 전투 (즉시 판정) =====

export type CombatResult = 'perfect' | 'victory' | 'narrow' | 'defeat' | 'wipe';

export interface CombatOutcome {
  result: CombatResult;
  monster: Monster;
  monsterPosition: Position;  // 몬스터 위치 (전투 후 타일 업데이트용)
  participants: string[];  // 참전한 플레이어 ID
  damages: { playerId: string; damage: number }[];
  drops: Item[];
  description: string;  // AI 생성 상황 묘사
}

// ===== 이벤트 =====

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
}

export interface EventChoice {
  id: string;
  text: string;
  result: string;
  effect: EventEffect;
}

export type EventEffect =
  | { type: 'heal'; amount: number }
  | { type: 'damage'; amount: number }
  | { type: 'item'; item: Item }
  | { type: 'combat'; monster: Monster }
  | { type: 'none' };

// ===== 방 =====

export type RoomState = 'waiting' | 'playing' | 'finished';

export interface Room {
  code: string;
  players: Player[];
  state: RoomState;
  dungeon: Dungeon | null;
  hostId: string;
  mapType: MapType;
}

// ===== 게임 결과 =====

export interface GameResult {
  escaped: string[];      // 탈출 성공한 플레이어
  died: string[];         // 사망한 플레이어
  totalLoot: Item[];      // 탈출한 총 전리품
  duration: number;       // 플레이 시간 (초)
}

// ===== Socket 페이로드 =====

// 로비
export interface CreateRoomPayload {
  playerName: string;
  playerClass: PlayerClass;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
  playerClass: PlayerClass;
}

export interface StartGamePayload {
  mapType: MapType;
}

export interface RoomCreatedResponse {
  roomCode: string;
  player: Player;
}

export interface RoomJoinedResponse {
  room: Room;
  player: Player;
}

export interface GameStartedResponse {
  dungeon: Dungeon;
  players: Player[];
}

// 탐험
export interface PlayerMovePayload {
  position: Position;
}

export interface PositionsUpdateResponse {
  positions: { playerId: string; position: Position }[];
}

export interface TileRevealedResponse {
  tiles: DungeonTile[];
}

// 전투
export interface CombatResultResponse {
  outcome: CombatOutcome;
  updatedPlayers: Player[];
}

// 아이템
export interface ItemPickupPayload {
  itemId: string;
  position: Position;
}

export interface ItemAcquiredResponse {
  playerId: string;
  item: Item;
}

// 이벤트
export interface EventTriggeredResponse {
  event: GameEvent;
}

export interface EventChoicePayload {
  eventId: string;
  choiceId: string;
}

export interface EventResultResponse {
  result: string;
  effect: EventEffect;
  updatedPlayer: Player;
}

// 게임 종료
export interface PlayerEscapedResponse {
  playerId: string;
  playerName: string;
  savedItems: Item[];
}

export interface PlayerDiedResponse {
  playerId: string;
  playerName: string;
  droppedItems: Item[];
  position: Position;
}

export interface GameOverResponse {
  result: GameResult;
}

// ===== 상수 =====

export const GAME_CONSTANTS = {
  // 방
  ROOM_CODE_LENGTH: 4,
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 2,
  
  // 열쇠
  DAILY_KEYS: 1,
  WEEKEND_KEYS: 2,
  MAX_KEYS: 3,
  
  // 클래스 스탯
  CLASS_STATS: {
    warrior: { hp: 120, combatPower: 20, ability: '파티 피해 -10%' },
    mage: { hp: 70, combatPower: 30, ability: '광역 전투 유리' },
    cleric: { hp: 90, combatPower: 10, ability: '전투 후 자동 힐' },
    rogue: { hp: 80, combatPower: 15, ability: '숨긴 아이템 발견' },
  },
  
  // 전투
  COMBAT_RANDOM_RANGE: 0.2,  // ±20%
  
  // 인원별 난이도
  DIFFICULTY_SCALE: {
    4: { hpMod: 1.0, atkMod: 1.0 },
    3: { hpMod: 0.75, atkMod: 0.85 },
    2: { hpMod: 0.5, atkMod: 0.7 },
  },
  
  // 맵
  MAP_INFO: {
    goblin_cave: { name: '고블린 동굴', difficulty: 1, duration: 10 },
    abandoned_mine: { name: '버려진 광산', difficulty: 2, duration: 12 },
    ancient_temple: { name: '고대 신전', difficulty: 3, duration: 15 },
    abyss: { name: '심연의 던전', difficulty: 4, duration: 20 },
  },
  
  // 위치 동기화
  POSITION_SYNC_INTERVAL: 100,  // ms
  
  // 시야
  VIEW_DISTANCE: 3,  // 타일
} as const;
