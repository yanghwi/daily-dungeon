// ===== 캐릭터 =====

export interface Character {
  id: string;
  socketId: string;
  userId?: string;             // DB User ID (로그인 시)
  name: string;                // 플레이어 입력
  background: string;          // "전직 경비원", "요리사", "개발자", "영업사원"
  trait: string;               // "용감한", "겁 많은", "호기심 많은", "말빨 좋은"
  weakness: string;            // "어둠을 무서워함", "거미 공포증" 등
  hp: number;
  maxHp: number;
  isAlive: boolean;
  equipment: Equipment;
  inventory: InventoryItem[];  // 런 중 획득한 아이템
  activeBuffs: TemporaryBuff[];  // 소모품 임시 버프
}

export interface TemporaryBuff {
  effect: ItemEffect;
  remainingWaves: number;   // 남은 웨이브 수 (0이면 만료)
  sourceItemId: string;
}

export interface Equipment {
  weapon: string;              // "알루미늄 배트", "식칼", "노트북", "명함"
  top: string;                 // 상의 (기존 armor → top)
  bottom: string;              // 하의
  hat: string;                 // 모자
  accessory: string;           // "행운의 열쇠고리", "손목시계", "보조배터리"
  // 장비 효과
  weaponBonus: number;         // 물리 행동 시 주사위 보정 (예: +2)
  armorBonus: number;          // top+bottom+hat 합산 방어 보정
  accessoryEffect: AccessoryEffect;
  // 장착된 아이템 ID (카탈로그 연결)
  weaponItemId?: string;
  topItemId?: string;
  bottomItemId?: string;
  hatItemId?: string;
  accessoryItemId?: string;
}

export type AccessoryEffect =
  | { type: 'reroll'; count: number }           // 주사위 다시 굴리기
  | { type: 'min_raise'; minValue: number }     // 최소 주사위 값 보장
  | { type: 'crit_expand'; critMin: number }    // 크리티컬 범위 확장 (기본 15)
  | { type: 'none' };

// ===== 아이템 시스템 =====

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface ItemDefinition {
  id: string;                    // "rusty_pipe"
  name: string;                  // "녹슨 파이프"
  type: 'weapon' | 'top' | 'bottom' | 'hat' | 'accessory' | 'consumable';
  rarity: ItemRarity;
  description: string;           // 게임 내 설명
  flavorText: string;            // EarthBound 스타일 한줄
  effects: ItemEffect[];         // 구조화된 효과
  tags: string[];                // LLM 컨텍스트용
  dropWeight: number;            // 가중 랜덤용
  bossOnly?: boolean;
  waveMinimum?: number;
}

export type ItemEffect =
  | { type: 'stat_bonus'; stat: 'weaponBonus' | 'armorBonus'; value: number }
  | { type: 'hp_restore'; value: number }
  | { type: 'dc_reduction'; category: ActionCategory | 'all'; value: number }
  | { type: 'min_raise'; minValue: number }
  | { type: 'reroll'; count: number }
  | { type: 'crit_expand'; critMin: number }
  | { type: 'damage_multiplier'; multiplier: number; condition?: 'boss' }
  | { type: 'wave_heal'; value: number };

export interface InventoryItem {
  itemId: string;                 // ItemDefinition.id 참조
  equipped: boolean;
}

export interface InventoryItemDisplay {
  itemId: string;
  equipped: boolean;
  name: string;
  type: 'weapon' | 'top' | 'bottom' | 'hat' | 'accessory' | 'consumable';
  rarity: ItemRarity;
  effect: string;       // summarizeEffects 결과
  flavorText: string;
}

// ===== 웨이브 전투 =====

export interface WaveTurn {
  waveNumber: number;
  situation: string;                 // LLM이 생성한 상황 묘사
  enemy: Enemy;
  playerChoices: PlayerChoiceSet[];  // 4명 각자의 선택지 세트
  playerActions: PlayerAction[];     // 4명의 선택 + 주사위 결과
  narrative: string;                 // LLM이 생성한 결과 서술
  damageResult: DamageResult;
}

export interface Enemy {
  name: string;                // "떠돌이 개 무리", "이상한 자판기"
  description: string;         // LLM이 생성한 1줄 설명
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  imageTag: string;            // 에셋 DB 매칭용 태그
}

export interface PlayerChoiceSet {
  playerId: string;
  options: ChoiceOption[];     // 2~3개
}

export interface ChoiceOption {
  id: string;
  text: string;                // "정면 돌파한다", "음식으로 유인한다"
  category: ActionCategory;    // 주사위 보정 계산용
  baseDC: number;              // 기본 난이도 (8~18)
}

export type ActionCategory = 'physical' | 'social' | 'technical' | 'defensive' | 'creative';

export interface PlayerAction {
  playerId: string;
  playerName: string;
  choiceId: string;
  choiceText: string;
  category: ActionCategory;
  roll: number;                // 원본 d20 결과 (1~20)
  bonus: number;               // 캐릭터 + 장비 보정
  effectiveRoll: number;       // roll + bonus
  dc: number;                  // 해당 선택지의 DC
  tier: RollTier;
}

export type RollTier = 'nat1' | 'fail' | 'normal' | 'critical' | 'nat20';
// nat1: roll === 1 (항상 실패, 황당한 재앙)
// fail: effectiveRoll < dc (실패)
// normal: effectiveRoll >= dc && effectiveRoll < dc + 5 (보통 성공)
// critical: effectiveRoll >= dc + 5 (강력한 성공)
// nat20: roll === 20 (항상 성공, 영웅적 순간)

export interface DamageResult {
  enemyDamage: number;         // 적에게 준 총 데미지
  playerDamages: { playerId: string; damage: number }[];  // 각자 받은 데미지
  enemyDefeated: boolean;
  loot: LootItem[];            // 적 처치 시 드랍
}

export interface LootItem {
  itemId: string;              // ItemDefinition.id 참조
  name: string;
  type: 'weapon' | 'top' | 'bottom' | 'hat' | 'accessory' | 'consumable';
  rarity: ItemRarity;
  description: string;
  effect: string;              // 사람이 읽을 수 있는 효과 설명
  assignedTo?: string;         // 분배된 플레이어 이름
  inventoryFull?: boolean;     // 인벤토리 가득 차서 획득 불가
}

// ===== 런 상태 =====

export interface RunState {
  roomCode: string;
  players: Character[];
  currentWave: number;
  maxWaves: number;            // 기본 10
  enemy: Enemy | null;
  accumulatedLoot: LootItem[];
  phase: RunPhase;
  waveHistory: WaveTurn[];     // 이번 런의 모든 웨이브 기록
  dailySeedId?: string;        // 데일리 던전 시드 ID (null이면 커스텀 모드)
  seed?: string;               // 데일리 던전 PRNG 시드값
}

export type RunPhase =
  | 'waiting'           // 로비 대기
  | 'character_setup'   // 캐릭터 생성
  | 'wave_intro'        // LLM이 상황 + 선택지 생성 중
  | 'choosing'          // 4명이 선택지 고르는 중
  | 'rolling'           // 4명이 주사위 굴리는 중
  | 'narrating'         // LLM이 결과 서술 중
  | 'wave_result'       // 전리품 표시 (3초)
  | 'maintenance'       // 장비 관리 + 계속/철수 투표
  | 'run_end';          // 런 종료 (철수/전멸/클리어)

// ===== 방 =====

export type RoomMode = 'custom' | 'daily';

export interface Room {
  code: string;
  players: Character[];
  hostId: string;
  run: RunState | null;
  phase: RunPhase;
  mode: RoomMode;
  dailySeedId?: string;
  seed?: string;
}

// ===== 소켓 이벤트 페이로드 =====

// Server → Client
export interface WaveIntroPayload {
  waveNumber: number;
  enemy: Enemy;
  situation: string;
  playerChoices: PlayerChoiceSet[];   // 이 클라이언트에 해당하는 선택지만 포함
}

export interface AllChoicesReadyPayload {
  // 4명 전원 선택 완료, 주사위 굴림 단계로 전환
  playerNames: string[];              // 선택 완료한 순서
}

export interface RollResultsPayload {
  actions: PlayerAction[];            // 4명의 선택 + 주사위 결과
}

export interface WaveNarrativePayload {
  narrative: string;                  // LLM 결과 서술 (스트리밍 또는 전체)
  damageResult: DamageResult;
  partyStatus: { playerId: string; name: string; hp: number; maxHp: number }[];
  enemyHp: number;
}

export interface WaveEndPayload {
  partyStatus: { playerId: string; name: string; hp: number; maxHp: number }[];
  loot: LootItem[];
  nextWavePreview?: string;           // "다음: 더 깊은 곳에서 이상한 소리가..."
}

export interface CombatChoicesPayload {
  combatRound: number;
  playerChoices: PlayerChoiceSet[];   // 이 클라이언트에 해당하는 선택지만
}

export interface MaintenanceStartPayload {
  partyStatus: { playerId: string; name: string; hp: number; maxHp: number }[];
  loot: LootItem[];
  nextWavePreview?: string;
}

export interface RunEndPayload {
  result: 'retreat' | 'wipe' | 'clear';
  totalLoot: LootItem[];
  highlights: string[];               // LLM이 생성한 이번 런 하이라이트 3줄
  waveHistory: WaveTurn[];
  newUnlocks?: string[];              // 새로 해금된 항목 ID (Phase F)
}

// Client → Server
export interface CreateRoomPayload {
  playerName: string;
  mode?: RoomMode;       // 'custom' (기본) | 'daily'
  dailySeedId?: string;  // 데일리 모드 시 시드 ID
  seed?: string;         // 데일리 모드 시 시드 값
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

export interface PlayerChoicePayload {
  choiceId: string;
}

export interface DiceRollPayload {
  // 클라이언트가 "굴리기" 버튼 탭 시 전송
  // 실제 난수는 서버에서 생성 (치트 방지)
}

export interface ContinueOrRetreatPayload {
  decision: 'continue' | 'retreat';
}

// Server → Client (로비)
export interface RoomCreatedResponse {
  roomCode: string;
  player: Character;
}

export interface RoomJoinedResponse {
  room: Room;
  player: Character;
}

export interface CharacterSetupPayload {
  name: string;
  background: string;
}

export interface EquipItemPayload {
  itemId: string;
}

export interface UnequipItemPayload {
  itemId: string;
}

export interface UseConsumablePayload {
  itemId: string;
}

export interface InventoryUpdatedPayload {
  inventory: InventoryItemDisplay[];
  equipment: Equipment;
  hp: number;
  maxHp: number;
  activeBuffs?: TemporaryBuff[];
}

export interface DiscardItemPayload {
  itemId: string;
}

// ===== 상수 =====

export const GAME_CONSTANTS = {
  // 방
  ROOM_CODE_LENGTH: 4,
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 1,

  // 기본 스탯
  DEFAULT_HP: 60,
  DEFAULT_MAX_HP: 60,

  // 웨이브
  MAX_WAVES: 10,
  MID_BOSS_WAVE: 5,
  FINAL_BOSS_WAVE: 10,

  // 타임아웃
  CHOICE_TIMEOUT: 10000,      // 선택지 10초
  DICE_ROLL_TIMEOUT: 5000,    // 주사위 5초
  VOTE_TIMEOUT: 30000,        // 계속/철수 30초
  MAINTENANCE_TIMEOUT: 45000,  // 정비 세션 45초

  // 인벤토리
  MAX_RUN_INVENTORY: 20,

  // 데미지 계산
  BASE_DAMAGE: 15,

  // 인원별 난이도
  DIFFICULTY_SCALE: {
    4: { hpMod: 1.0, atkMod: 1.0 },
    3: { hpMod: 0.85, atkMod: 0.9 },
    2: { hpMod: 0.7, atkMod: 0.8 },
    1: { hpMod: 0.5, atkMod: 0.6 },
  },
} as const;

// ===== 소켓 이벤트 이름 =====

export const SOCKET_EVENTS = {
  // 로비
  CREATE_ROOM: 'create-room',
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  ROOM_CREATED: 'room-created',
  ROOM_JOINED: 'room-joined',
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',

  // 캐릭터 설정
  CHARACTER_SETUP: 'character-setup',
  CHARACTER_READY: 'character-ready',
  ALL_CHARACTERS_READY: 'all-characters-ready',

  // 게임 진행
  START_GAME: 'start-game',
  GAME_STARTED: 'game-started',

  // 전투 (새 코어 루프)
  WAVE_INTRO: 'wave-intro',
  PLAYER_CHOICE: 'player-choice',
  ALL_CHOICES_READY: 'all-choices-ready',
  DICE_ROLL: 'dice-roll',
  ROLL_RESULTS: 'roll-results',
  WAVE_NARRATIVE: 'wave-narrative',
  WAVE_END: 'wave-end',
  CONTINUE_OR_RETREAT: 'continue-or-retreat',

  // Phase 전환 (서버 → 클라이언트)
  PHASE_CHANGE: 'phase-change',

  // 런 종료
  RUN_END: 'run-end',

  // 멀티라운드 전투 + 정비
  COMBAT_CHOICES: 'combat-choices',
  MAINTENANCE_START: 'maintenance-start',

  // 투표 현황
  VOTE_UPDATE: 'vote-update',

  // 아이템/인벤토리
  EQUIP_ITEM: 'equip-item',
  UNEQUIP_ITEM: 'unequip-item',
  USE_CONSUMABLE: 'use-consumable',
  DISCARD_ITEM: 'discard-item',
  INVENTORY_UPDATED: 'inventory-updated',

  // 재접속
  RECONNECT_ATTEMPT: 'reconnect-attempt',
  RECONNECT_SUCCESS: 'reconnect-success',
  RECONNECT_FAILED: 'reconnect-failed',

  // 에러
  ERROR: 'error',
} as const;
