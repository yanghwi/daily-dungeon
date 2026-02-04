import type { DungeonTile, Position, MapType, Monster } from './types.js';

// 몬스터 템플릿 (서버와 공유)
interface MonsterTemplate {
  name: string;
  combatPower: number;
  description: string;
}

const MONSTER_TEMPLATES: Record<MapType, MonsterTemplate[]> = {
  goblin_cave: [
    { name: '고블린', combatPower: 15, description: '녹색 피부에 날카로운 이빨을 가진 작은 생명체' },
    { name: '고블린 전사', combatPower: 25, description: '조잡한 갑옷을 두른 고블린, 동족보다 강하다' },
    { name: '고블린 주술사', combatPower: 35, description: '기이한 주문을 외우는 고블린, 위험하다' },
  ],
  abandoned_mine: [
    { name: '광산 쥐', combatPower: 20, description: '어둠 속에서 자란 거대한 쥐' },
    { name: '무너진 광부', combatPower: 40, description: '광산에서 목숨을 잃은 광부의 망령' },
    { name: '동굴 트롤', combatPower: 60, description: '광산 깊은 곳에 서식하는 거대한 트롤' },
  ],
  ancient_temple: [
    { name: '석상 병사', combatPower: 45, description: '고대 신전을 지키는 돌로 만든 병사' },
    { name: '신전 수호자', combatPower: 70, description: '신전의 비밀을 지키는 신비로운 존재' },
    { name: '타락한 사제', combatPower: 90, description: '어둠에 물든 고대 사제, 강력한 저주를 사용한다' },
  ],
  abyss: [
    { name: '심연의 그림자', combatPower: 80, description: '형체 없는 어둠의 존재' },
    { name: '심연 파수꾼', combatPower: 110, description: '심연의 깊은 곳을 지키는 거대한 괴물' },
    { name: '고대 악마', combatPower: 150, description: '봉인에서 풀려난 고대의 악마, 극도로 위험하다' },
  ],
};

// UUID 생성 (간단한 버전)
function generateId(): string {
  return 'monster-' + Math.random().toString(36).substring(2, 11);
}

// 몬스터 생성
function createMonsterForRoom(mapType: MapType, roomIndex: number, totalRooms: number): Monster {
  const templates = MONSTER_TEMPLATES[mapType];
  // 방 번호가 클수록 강한 몬스터 확률 증가
  const difficultyBias = roomIndex / totalRooms;
  const weights = templates.map((_, index) => Math.pow(1 - difficultyBias, templates.length - 1 - index));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let random = Math.random() * totalWeight;
  for (let i = 0; i < templates.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      const template = templates[i];
      return {
        id: generateId(),
        name: template.name,
        combatPower: template.combatPower,
        description: template.description,
      };
    }
  }

  // 폴백
  const template = templates[0];
  return {
    id: generateId(),
    name: template.name,
    combatPower: template.combatPower,
    description: template.description,
  };
}

// 맵 크기 설정
const MAP_SIZES: Record<MapType, { width: number; height: number }> = {
  goblin_cave: { width: 25, height: 30 },
  abandoned_mine: { width: 30, height: 35 },
  ancient_temple: { width: 35, height: 40 },
  abyss: { width: 40, height: 45 },
};

// 간단한 절차적 던전 생성 (BSP 알고리즘 간소화)
export function generateDungeon(mapType: MapType = 'goblin_cave'): {
  tiles: DungeonTile[][];
  spawnPoint: Position;
  portalPosition: Position;
} {
  const { width, height } = MAP_SIZES[mapType];

  // 초기화: 모든 타일을 벽으로
  const tiles: DungeonTile[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = {
        x,
        y,
        type: 'wall',
        explored: false,
        content: null,
      };
    }
  }

  // 방 생성
  const rooms: { x: number; y: number; w: number; h: number }[] = [];
  const numRooms = 6 + Math.floor(Math.random() * 4); // 6-9개 방

  for (let i = 0; i < numRooms * 10; i++) {
    if (rooms.length >= numRooms) break;

    const roomW = 4 + Math.floor(Math.random() * 4); // 4-7 크기
    const roomH = 4 + Math.floor(Math.random() * 4);
    const roomX = 1 + Math.floor(Math.random() * (width - roomW - 2));
    const roomY = 1 + Math.floor(Math.random() * (height - roomH - 2));

    // 다른 방과 겹치는지 체크
    let overlaps = false;
    for (const room of rooms) {
      if (
        roomX < room.x + room.w + 2 &&
        roomX + roomW + 2 > room.x &&
        roomY < room.y + room.h + 2 &&
        roomY + roomH + 2 > room.y
      ) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      rooms.push({ x: roomX, y: roomY, w: roomW, h: roomH });

      // 방 내부를 바닥으로
      for (let ry = roomY; ry < roomY + roomH; ry++) {
        for (let rx = roomX; rx < roomX + roomW; rx++) {
          tiles[ry][rx].type = 'floor';
        }
      }
    }
  }

  // 방들을 복도로 연결
  for (let i = 1; i < rooms.length; i++) {
    const prevRoom = rooms[i - 1];
    const currRoom = rooms[i];

    // 이전 방의 중심
    const prevCenterX = Math.floor(prevRoom.x + prevRoom.w / 2);
    const prevCenterY = Math.floor(prevRoom.y + prevRoom.h / 2);

    // 현재 방의 중심
    const currCenterX = Math.floor(currRoom.x + currRoom.w / 2);
    const currCenterY = Math.floor(currRoom.y + currRoom.h / 2);

    // L자형 복도 생성
    if (Math.random() < 0.5) {
      // 가로 먼저, 세로 나중
      createHorizontalTunnel(tiles, prevCenterX, currCenterX, prevCenterY);
      createVerticalTunnel(tiles, prevCenterY, currCenterY, currCenterX);
    } else {
      // 세로 먼저, 가로 나중
      createVerticalTunnel(tiles, prevCenterY, currCenterY, prevCenterX);
      createHorizontalTunnel(tiles, prevCenterX, currCenterX, currCenterY);
    }
  }

  // 스폰 포인트 (첫 번째 방 중앙)
  const spawnRoom = rooms[0];
  const spawnPoint: Position = {
    x: Math.floor(spawnRoom.x + spawnRoom.w / 2),
    y: Math.floor(spawnRoom.y + spawnRoom.h / 2),
  };

  // 포탈 위치 (마지막 방 중앙)
  const portalRoom = rooms[rooms.length - 1];
  const portalPosition: Position = {
    x: Math.floor(portalRoom.x + portalRoom.w / 2),
    y: Math.floor(portalRoom.y + portalRoom.h / 2),
  };

  // 포탈 타일 설정
  tiles[portalPosition.y][portalPosition.x].type = 'portal';
  tiles[portalPosition.y][portalPosition.x].content = { type: 'portal' };

  // 문 추가 (복도 입구에)
  addDoors(tiles, rooms);

  // 몬스터 배치 (스폰/포탈 방 제외)
  placeMonsters(tiles, rooms, mapType, spawnPoint, portalPosition);

  return { tiles, spawnPoint, portalPosition };
}

function createHorizontalTunnel(
  tiles: DungeonTile[][],
  x1: number,
  x2: number,
  y: number
) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);

  for (let x = minX; x <= maxX; x++) {
    if (y > 0 && y < tiles.length && x > 0 && x < tiles[y].length) {
      tiles[y][x].type = 'floor';
    }
  }
}

function createVerticalTunnel(
  tiles: DungeonTile[][],
  y1: number,
  y2: number,
  x: number
) {
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  for (let y = minY; y <= maxY; y++) {
    if (y > 0 && y < tiles.length && x > 0 && x < tiles[y].length) {
      tiles[y][x].type = 'floor';
    }
  }
}

function addDoors(
  tiles: DungeonTile[][],
  rooms: { x: number; y: number; w: number; h: number }[]
) {
  // 복도와 방의 경계에 문 추가 (낮은 확률)
  for (let y = 1; y < tiles.length - 1; y++) {
    for (let x = 1; x < tiles[y].length - 1; x++) {
      if (tiles[y][x].type !== 'floor') continue;

      // 수평 문 체크 (좌우가 벽, 상하가 바닥)
      const isHorizontalDoorway =
        tiles[y][x - 1]?.type === 'wall' &&
        tiles[y][x + 1]?.type === 'wall' &&
        tiles[y - 1]?.[x]?.type === 'floor' &&
        tiles[y + 1]?.[x]?.type === 'floor';

      // 수직 문 체크 (상하가 벽, 좌우가 바닥)
      const isVerticalDoorway =
        tiles[y - 1]?.[x]?.type === 'wall' &&
        tiles[y + 1]?.[x]?.type === 'wall' &&
        tiles[y][x - 1]?.type === 'floor' &&
        tiles[y][x + 1]?.type === 'floor';

      if ((isHorizontalDoorway || isVerticalDoorway) && Math.random() < 0.3) {
        tiles[y][x].type = 'door';
      }
    }
  }
}

function placeMonsters(
  tiles: DungeonTile[][],
  rooms: { x: number; y: number; w: number; h: number }[],
  mapType: MapType,
  spawnPoint: Position,
  portalPosition: Position
) {
  // 첫 번째 방(스폰)과 마지막 방(포탈)은 제외
  for (let i = 1; i < rooms.length - 1; i++) {
    const room = rooms[i];
    const monstersInRoom = Math.floor(Math.random() * 3); // 0-2마리

    for (let m = 0; m < monstersInRoom; m++) {
      // 방 내부에서 랜덤 위치 선택
      const attempts = 10;
      for (let a = 0; a < attempts; a++) {
        const x = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const y = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

        // 스폰/포탈 위치가 아니고, 바닥이고, 이미 콘텐츠가 없는 경우
        if (
          tiles[y]?.[x]?.type === 'floor' &&
          !tiles[y][x].content &&
          !(x === spawnPoint.x && y === spawnPoint.y) &&
          !(x === portalPosition.x && y === portalPosition.y)
        ) {
          const monster = createMonsterForRoom(mapType, i, rooms.length);
          tiles[y][x].content = { type: 'monster', monster };
          break;
        }
      }
    }
  }

  // 마지막 방(포탈 방)에도 약간의 몬스터 배치 (포탈 근처만 아니면)
  const portalRoom = rooms[rooms.length - 1];
  if (Math.random() < 0.7) { // 70% 확률로 포탈 방에 1마리
    const attempts = 10;
    for (let a = 0; a < attempts; a++) {
      const x = portalRoom.x + 1 + Math.floor(Math.random() * (portalRoom.w - 2));
      const y = portalRoom.y + 1 + Math.floor(Math.random() * (portalRoom.h - 2));

      // 포탈과 최소 2타일 거리
      const distToPortal = Math.abs(x - portalPosition.x) + Math.abs(y - portalPosition.y);
      if (
        tiles[y]?.[x]?.type === 'floor' &&
        !tiles[y][x].content &&
        distToPortal >= 2
      ) {
        const monster = createMonsterForRoom(mapType, rooms.length - 1, rooms.length);
        tiles[y][x].content = { type: 'monster', monster };
        break;
      }
    }
  }
}
