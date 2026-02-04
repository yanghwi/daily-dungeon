import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import type { Position, Player, DungeonTile, PlayerClass, Monster } from '@daily-dungeon/shared';

// 타일 색상 (픽셀 던전 스타일)
const TILE_COLORS: Record<DungeonTile['type'] | 'unexplored', number> = {
  floor: 0x2a2a4a,
  wall: 0x1a1a2e,
  door: 0x7c3aed,
  portal: 0x06b6d4,
  unexplored: 0x0f0f1a,
};

// 플레이어 색상 (클래스별)
const CLASS_COLORS: Record<PlayerClass, number> = {
  warrior: 0xef4444,
  mage: 0x7c3aed,
  cleric: 0xfbbf24,
  rogue: 0x22c55e,
};

// 몬스터 색상
const MONSTER_COLOR = 0xff6b6b;

interface GameData {
  playerId: string;
  players: Player[];
  dungeonTiles: DungeonTile[][];
  onMove: (position: Position) => void;
  onEncounterMonster: (monsterId: string, monsterPos: Position) => void;
}

export class ExploreScene extends Phaser.Scene {
  // 타일맵 관련
  private tileGraphics!: Phaser.GameObjects.Graphics;
  private dungeonTiles: DungeonTile[][] = [];
  private exploredTiles: Set<string> = new Set();

  // 플레이어 관련
  private playerId: string = '';
  private playerSprite!: Phaser.GameObjects.Arc;
  private otherPlayers: Map<string, Phaser.GameObjects.Arc> = new Map();
  private players: Player[] = [];

  // 이동 관련
  private joystick!: Phaser.GameObjects.Container;
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickKnob!: Phaser.GameObjects.Arc;
  private joystickActive: boolean = false;
  private joystickStartPos: Position = { x: 0, y: 0 };
  private moveDirection: Position = { x: 0, y: 0 };

  // 콜백
  private onMoveCallback?: (position: Position) => void;
  private onEncounterMonsterCallback?: (monsterId: string, monsterPos: Position) => void;

  // 몬스터 관련
  private monsterSprites: Map<string, Phaser.GameObjects.Arc> = new Map();
  private encounteredMonsters: Set<string> = new Set();
  private isCombatActive: boolean = false;

  // 동기화 타이머
  private lastSyncTime: number = 0;

  constructor() {
    super({ key: 'ExploreScene' });
  }

  init(data: GameData) {
    if (!data) {
      console.warn('ExploreScene: No data provided to init');
      return;
    }
    this.playerId = data.playerId || '';
    this.players = data.players || [];
    this.dungeonTiles = data.dungeonTiles || [];
    this.onMoveCallback = data.onMove;
    this.onEncounterMonsterCallback = data.onEncounterMonster;

    // 상태 초기화
    this.monsterSprites.clear();
    this.encounteredMonsters.clear();
    this.isCombatActive = false;
  }

  create() {
    // 데이터 유효성 검사
    if (!this.dungeonTiles || this.dungeonTiles.length === 0) {
      console.error('ExploreScene: No dungeon tiles available');
      return;
    }

    console.log('ExploreScene: Creating scene with', this.dungeonTiles.length, 'rows');

    // 그래픽 객체 생성
    this.tileGraphics = this.add.graphics();

    // 던전 맵 렌더링
    this.renderDungeon();

    // 플레이어 생성
    this.createPlayers();

    // 가상 조이스틱 생성
    this.createJoystick();

    // 카메라 설정
    this.setupCamera();

    // 입력 이벤트 설정
    this.setupInput();
  }

  update(time: number, delta: number) {
    // 전투 중에는 이동 불가
    if (this.isCombatActive) return;

    // 플레이어 이동 처리
    this.handleMovement(delta);

    // 위치 동기화 (100ms 간격)
    if (time - this.lastSyncTime >= GAME_CONFIG.SYNC_INTERVAL) {
      this.syncPosition();
      this.lastSyncTime = time;
    }

    // 시야 업데이트
    this.updateVisibility();

    // 몬스터 접촉 감지
    this.checkMonsterEncounter();
  }

  // 던전 맵 렌더링
  private renderDungeon() {
    const { TILE_SIZE } = GAME_CONFIG;

    this.tileGraphics.clear();

    for (let y = 0; y < this.dungeonTiles.length; y++) {
      for (let x = 0; x < this.dungeonTiles[y].length; x++) {
        const tile = this.dungeonTiles[y][x];
        const key = `${x},${y}`;
        const isExplored = this.exploredTiles.has(key);

        let color = TILE_COLORS.unexplored;
        if (isExplored || tile.explored) {
          switch (tile.type) {
            case 'floor':
              color = TILE_COLORS.floor;
              break;
            case 'wall':
              color = TILE_COLORS.wall;
              break;
            case 'door':
              color = TILE_COLORS.door;
              break;
            case 'portal':
              color = TILE_COLORS.portal;
              break;
          }
        }

        this.tileGraphics.fillStyle(color, 1);
        this.tileGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);

        // 포탈 특별 효과
        if ((isExplored || tile.explored) && tile.type === 'portal') {
          this.tileGraphics.fillStyle(0xffffff, 0.3);
          this.tileGraphics.fillRect(
            x * TILE_SIZE + 4,
            y * TILE_SIZE + 4,
            TILE_SIZE - 9,
            TILE_SIZE - 9
          );
        }

        // 몬스터 렌더링
        if ((isExplored || tile.explored) && tile.content?.type === 'monster') {
          this.renderMonster(tile.content.monster, x, y);
        }

        // 아이템 표시
        if ((isExplored || tile.explored) && tile.content?.type === 'item') {
          this.tileGraphics.fillStyle(0xfbbf24, 0.8);
          this.tileGraphics.fillRect(
            x * TILE_SIZE + TILE_SIZE / 4,
            y * TILE_SIZE + TILE_SIZE / 4,
            TILE_SIZE / 2,
            TILE_SIZE / 2
          );
        }
      }
    }
  }

  // 몬스터 렌더링
  private renderMonster(monster: Monster, x: number, y: number) {
    const { TILE_SIZE } = GAME_CONFIG;

    // 이미 스프라이트가 있으면 스킵
    if (this.monsterSprites.has(monster.id)) return;

    const posX = x * TILE_SIZE + TILE_SIZE / 2;
    const posY = y * TILE_SIZE + TILE_SIZE / 2;

    const sprite = this.add.circle(posX, posY, TILE_SIZE / 3, MONSTER_COLOR);
    sprite.setStrokeStyle(2, 0xffffff);
    sprite.setDepth(5);

    // 몬스터 데이터 저장
    sprite.setData('monster', monster);
    sprite.setData('tileX', x);
    sprite.setData('tileY', y);

    this.monsterSprites.set(monster.id, sprite);
  }

  // 플레이어 생성
  private createPlayers() {
    const { TILE_SIZE } = GAME_CONFIG;

    for (const player of this.players) {
      const x = player.position.x * TILE_SIZE + TILE_SIZE / 2;
      const y = player.position.y * TILE_SIZE + TILE_SIZE / 2;
      const color = CLASS_COLORS[player.class] || 0xffffff;

      const sprite = this.add.circle(x, y, TILE_SIZE / 3, color);
      sprite.setStrokeStyle(2, 0xffffff);
      sprite.setDepth(10);

      if (player.id === this.playerId) {
        this.playerSprite = sprite;
        // 내 플레이어는 더 밝게
        sprite.setStrokeStyle(3, 0xfbbf24);
      } else {
        this.otherPlayers.set(player.id, sprite);
      }
    }
  }

  // 가상 조이스틱 생성
  private createJoystick() {
    const baseRadius = 50;
    const knobRadius = 25;

    // 조이스틱 컨테이너 (화면 하단 왼쪽)
    this.joystick = this.add.container(0, 0);
    this.joystick.setDepth(100);
    this.joystick.setScrollFactor(0);
    this.joystick.setAlpha(0);

    // 베이스
    this.joystickBase = this.add.circle(0, 0, baseRadius, 0x4f46e5, 0.3);
    this.joystickBase.setStrokeStyle(2, 0x7c3aed);

    // 노브
    this.joystickKnob = this.add.circle(0, 0, knobRadius, 0x7c3aed, 0.8);

    this.joystick.add([this.joystickBase, this.joystickKnob]);
  }

  // 카메라 설정
  private setupCamera() {
    if (!this.playerSprite) return;

    // 맵 크기
    const mapWidth = this.dungeonTiles[0]?.length * GAME_CONFIG.TILE_SIZE || 800;
    const mapHeight = this.dungeonTiles.length * GAME_CONFIG.TILE_SIZE || 600;

    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);
  }

  // 입력 이벤트 설정
  private setupInput() {
    // 터치/마우스 다운
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.joystickActive = true;
      this.joystickStartPos = { x: pointer.x, y: pointer.y };
      this.joystick.setPosition(pointer.x, pointer.y);
      this.joystick.setAlpha(1);
    });

    // 터치/마우스 이동
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.joystickActive) return;

      const maxDistance = 50;
      const dx = pointer.x - this.joystickStartPos.x;
      const dy = pointer.y - this.joystickStartPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const clampedDistance = Math.min(distance, maxDistance);
        const normalizedX = dx / distance;
        const normalizedY = dy / distance;

        this.joystickKnob.setPosition(
          normalizedX * clampedDistance,
          normalizedY * clampedDistance
        );

        this.moveDirection = {
          x: normalizedX * (clampedDistance / maxDistance),
          y: normalizedY * (clampedDistance / maxDistance),
        };
      }
    });

    // 터치/마우스 업
    this.input.on('pointerup', () => {
      this.joystickActive = false;
      this.joystick.setAlpha(0);
      this.joystickKnob.setPosition(0, 0);
      this.moveDirection = { x: 0, y: 0 };
    });
  }

  // 이동 처리
  private handleMovement(delta: number) {
    if (!this.playerSprite || (this.moveDirection.x === 0 && this.moveDirection.y === 0)) {
      return;
    }

    const speed = GAME_CONFIG.MOVE_SPEED * (delta / 1000);
    let newX = this.playerSprite.x + this.moveDirection.x * speed;
    let newY = this.playerSprite.y + this.moveDirection.y * speed;

    // 충돌 체크
    const tileX = Math.floor(newX / GAME_CONFIG.TILE_SIZE);
    const tileY = Math.floor(newY / GAME_CONFIG.TILE_SIZE);

    if (this.isWalkable(tileX, tileY)) {
      this.playerSprite.setPosition(newX, newY);
    } else {
      // 벽에 부딪히면 슬라이딩 시도
      const currentTileX = Math.floor(this.playerSprite.x / GAME_CONFIG.TILE_SIZE);
      const currentTileY = Math.floor(this.playerSprite.y / GAME_CONFIG.TILE_SIZE);

      // X 방향만 이동 시도
      if (this.isWalkable(tileX, currentTileY)) {
        this.playerSprite.setPosition(newX, this.playerSprite.y);
      }
      // Y 방향만 이동 시도
      else if (this.isWalkable(currentTileX, tileY)) {
        this.playerSprite.setPosition(this.playerSprite.x, newY);
      }
    }
  }

  // 이동 가능 여부 체크
  private isWalkable(tileX: number, tileY: number): boolean {
    if (tileY < 0 || tileY >= this.dungeonTiles.length) return false;
    if (tileX < 0 || tileX >= this.dungeonTiles[tileY].length) return false;

    const tile = this.dungeonTiles[tileY][tileX];
    return tile.type !== 'wall';
  }

  // 위치 동기화
  private syncPosition() {
    if (!this.playerSprite || !this.onMoveCallback) return;

    const position: Position = {
      x: this.playerSprite.x / GAME_CONFIG.TILE_SIZE,
      y: this.playerSprite.y / GAME_CONFIG.TILE_SIZE,
    };

    this.onMoveCallback(position);
  }

  // 시야 업데이트
  private updateVisibility() {
    if (!this.playerSprite) return;

    const playerTileX = Math.floor(this.playerSprite.x / GAME_CONFIG.TILE_SIZE);
    const playerTileY = Math.floor(this.playerSprite.y / GAME_CONFIG.TILE_SIZE);
    const viewDistance = GAME_CONFIG.VIEW_DISTANCE;

    let needsRedraw = false;

    for (let dy = -viewDistance; dy <= viewDistance; dy++) {
      for (let dx = -viewDistance; dx <= viewDistance; dx++) {
        const x = playerTileX + dx;
        const y = playerTileY + dy;

        if (y >= 0 && y < this.dungeonTiles.length && x >= 0 && x < this.dungeonTiles[y].length) {
          const key = `${x},${y}`;
          if (!this.exploredTiles.has(key)) {
            this.exploredTiles.add(key);
            needsRedraw = true;
          }
        }
      }
    }

    if (needsRedraw) {
      this.renderDungeon();
    }
  }

  // 외부에서 다른 플레이어 위치 업데이트
  public updatePlayerPosition(playerId: string, position: Position) {
    if (playerId === this.playerId) return;

    const sprite = this.otherPlayers.get(playerId);
    if (sprite) {
      const x = position.x * GAME_CONFIG.TILE_SIZE;
      const y = position.y * GAME_CONFIG.TILE_SIZE;

      // 부드러운 이동을 위해 트윈 사용
      this.tweens.add({
        targets: sprite,
        x,
        y,
        duration: GAME_CONFIG.SYNC_INTERVAL,
        ease: 'Linear',
      });
    }
  }

  // 타일 공개 업데이트
  public revealTiles(tiles: DungeonTile[]) {
    for (const tile of tiles) {
      this.dungeonTiles[tile.y][tile.x] = tile;
      this.exploredTiles.add(`${tile.x},${tile.y}`);
    }
    this.renderDungeon();
  }

  // 몬스터 접촉 감지
  private checkMonsterEncounter() {
    if (!this.playerSprite || this.isCombatActive) return;

    const playerTileX = Math.floor(this.playerSprite.x / GAME_CONFIG.TILE_SIZE);
    const playerTileY = Math.floor(this.playerSprite.y / GAME_CONFIG.TILE_SIZE);

    const tile = this.dungeonTiles[playerTileY]?.[playerTileX];
    if (!tile || tile.content?.type !== 'monster') return;

    const monster = tile.content.monster;

    // 이미 조우한 몬스터인지 확인
    if (this.encounteredMonsters.has(monster.id)) return;

    // 몬스터 조우 처리
    this.encounteredMonsters.add(monster.id);
    console.log('Encountered monster:', monster.name);

    // 서버에 전투 요청
    if (this.onEncounterMonsterCallback) {
      this.onEncounterMonsterCallback(monster.id, { x: playerTileX, y: playerTileY });
    }
  }

  // 전투 상태 설정 (외부에서 호출)
  public setCombatActive(active: boolean) {
    this.isCombatActive = active;
  }

  // 몬스터 제거 (전투 후)
  public removeMonster(monsterId: string) {
    const sprite = this.monsterSprites.get(monsterId);
    if (sprite) {
      const tileX = sprite.getData('tileX');
      const tileY = sprite.getData('tileY');

      // 타일에서 몬스터 제거
      if (this.dungeonTiles[tileY]?.[tileX]) {
        const tile = this.dungeonTiles[tileY][tileX];
        if (tile.content?.type === 'monster') {
          tile.content = null;
        }
      }

      // 스프라이트 제거
      sprite.destroy();
      this.monsterSprites.delete(monsterId);
    }
  }

  // 던전 타일 업데이트 (전투 후 아이템 드랍 등)
  public updateTile(x: number, y: number, tile: DungeonTile) {
    this.dungeonTiles[y][x] = tile;
    this.renderDungeon();
  }
}
