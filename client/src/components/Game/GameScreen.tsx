import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GameCanvas, GameCanvasHandle } from './GameCanvas';
import { CombatPopup } from '../Combat/CombatPopup';
import { useGameStore } from '../../stores/gameStore';
import { theme } from '../../styles/theme';
import type { Position, DungeonTile, Player } from '@daily-dungeon/shared';
import type { Socket } from 'socket.io-client';

interface GameScreenProps {
  socket: Socket | null;
}

export function GameScreen({ socket }: GameScreenProps) {
  const { player, room, combat, clearCombat } = useGameStore();
  const [dungeonTiles, setDungeonTiles] = useState<DungeonTile[][] | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [spawnPoint, setSpawnPoint] = useState<Position | null>(null);
  const gameCanvasRef = useRef<GameCanvasHandle>(null);

  // 서버에서 받은 던전 데이터 사용
  useEffect(() => {
    // room.state가 'playing'이고 서버에서 던전을 받았을 때만
    if (!room || room.state !== 'playing' || !room.dungeon) return;

    // 이미 던전이 설정되었으면 스킵
    if (dungeonTiles) return;

    console.log('Using server-generated dungeon for mapType:', room.mapType);

    const serverDungeon = room.dungeon;
    setDungeonTiles(serverDungeon.tiles);
    setSpawnPoint(serverDungeon.spawnPoint);

    // 플레이어 초기 위치 설정
    const initialPlayers: Player[] = room.players.map((p: Player, index: number) => ({
      ...p,
      position: {
        x: serverDungeon.spawnPoint.x + (index % 2),
        y: serverDungeon.spawnPoint.y + Math.floor(index / 2),
      },
    }));
    setPlayers(initialPlayers);
  }, [room, room?.state, room?.dungeon, dungeonTiles]);

  // Socket 이벤트 리스너
  useEffect(() => {
    if (!socket) return;

    // 다른 플레이어 위치 업데이트
    const handlePositionsUpdate = (data: { positions: { playerId: string; position: Position }[] }) => {
      setPlayers(prev =>
        prev.map(p => {
          const update = data.positions.find(pos => pos.playerId === p.id);
          return update ? { ...p, position: update.position } : p;
        })
      );
    };

    // 타일 공개
    const handleTileRevealed = (data: { tiles: DungeonTile[] }) => {
      setDungeonTiles(prev => {
        if (!prev) return prev;
        const newTiles = [...prev.map(row => [...row])];
        for (const tile of data.tiles) {
          newTiles[tile.y][tile.x] = { ...tile, explored: true };
        }
        return newTiles;
      });
    };

    socket.on('positions-update', handlePositionsUpdate);
    socket.on('tile-revealed', handleTileRevealed);

    return () => {
      socket.off('positions-update', handlePositionsUpdate);
      socket.off('tile-revealed', handleTileRevealed);
    };
  }, [socket]);

  // 플레이어 이동 콜백
  const handleMove = useCallback(
    (position: Position) => {
      if (!socket || !player) return;
      socket.emit('player-move', { position });
    },
    [socket, player]
  );

  // 몬스터 조우 콜백
  const handleEncounterMonster = useCallback(
    (monsterId: string, monsterPos: Position) => {
      if (!socket || !player) return;
      console.log('[GameScreen] encounterMonster:', monsterId, monsterPos);
      socket.emit('encounter-monster', { monsterId, monsterPos });
    },
    [socket, player]
  );

  // 전투 팝업 닫기
  const handleCloseCombat = useCallback(() => {
    // 전투 후 던전 타일 업데이트 (몬스터 제거, 아이템 드랍)
    if (combat.outcome && room?.dungeon) {
      const { monsterPosition, drops, monster } = combat.outcome;

      // Phaser 씬에서 몬스터 스프라이트 제거
      gameCanvasRef.current?.removeMonster(monster.id);

      // 로컬 타일 상태 업데이트
      setDungeonTiles((prev) => {
        if (!prev || !monsterPosition) return prev;

        const newTiles = prev.map((row, rowY) =>
          rowY === monsterPosition.y
            ? row.map((tile, colX) =>
                colX === monsterPosition.x
                  ? {
                      ...tile,
                      content: drops.length > 0
                        ? { type: 'item' as const, item: drops[0] }
                        : null,
                    }
                  : tile
              )
            : row
        );
        return newTiles;
      });

      // Phaser 씬 타일 업데이트
      if (monsterPosition) {
        const newContent = drops.length > 0
          ? { type: 'item' as const, item: drops[0] }
          : null;
        gameCanvasRef.current?.updateTileContent(monsterPosition, newContent);
      }
    }

    clearCombat();
  }, [clearCombat, combat.outcome, room?.dungeon]);

  if (!player || !room || !dungeonTiles) {
    return (
      <div style={styles.loading}>
        <p>던전 생성 중...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* HUD - 상단 */}
      <div style={styles.hud}>
        <div style={styles.hudLeft}>
          <span style={styles.mapName}>{room.mapType}</span>
        </div>
        <div style={styles.hudRight}>
          <span style={styles.playerCount}>{players.length}명</span>
        </div>
      </div>

      {/* 게임 캔버스 */}
      <div style={styles.canvasContainer}>
        <GameCanvas
          ref={gameCanvasRef}
          playerId={player.id}
          players={players}
          dungeonTiles={dungeonTiles}
          onMove={handleMove}
          onEncounterMonster={handleEncounterMonster}
          isCombatActive={combat.isActive}
        />
      </div>

      {/* 전투 팝업 */}
      {combat.isActive && <CombatPopup onClose={handleCloseCombat} />}

      {/* 미니맵 - 우측 상단 */}
      <div style={styles.minimap}>
        <Minimap tiles={dungeonTiles} players={players} playerId={player.id} />
      </div>
    </div>
  );
}

// 미니맵 컴포넌트
interface MinimapProps {
  tiles: DungeonTile[][];
  players: Player[];
  playerId: string;
}

function Minimap({ tiles, players, playerId }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 2;
    const width = tiles[0]?.length || 0;
    const height = tiles.length;

    canvas.width = width * scale;
    canvas.height = height * scale;

    // 타일 그리기
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tiles[y][x];
        if (!tile.explored) {
          ctx.fillStyle = '#0f0f1a';
        } else {
          switch (tile.type) {
            case 'floor':
              ctx.fillStyle = '#2a2a4a';
              break;
            case 'wall':
              ctx.fillStyle = '#1a1a2e';
              break;
            case 'door':
              ctx.fillStyle = '#7c3aed';
              break;
            case 'portal':
              ctx.fillStyle = '#06b6d4';
              break;
          }
        }
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    // 플레이어 위치 표시
    for (const player of players) {
      ctx.fillStyle = player.id === playerId ? '#fbbf24' : '#ffffff';
      ctx.beginPath();
      ctx.arc(
        player.position.x * scale + scale / 2,
        player.position.y * scale + scale / 2,
        scale,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }, [tiles, players, playerId]);

  return <canvas ref={canvasRef} style={styles.minimapCanvas} />;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    background: theme.colors.bgDarkest,
    position: 'relative',
    overflow: 'hidden',
  },
  loading: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: theme.colors.bgDarkest,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.body,
  },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50px',
    background: 'rgba(15, 15, 26, 0.9)',
    borderBottom: `2px solid ${theme.colors.borderMedium}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
    zIndex: 50,
  },
  hudLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  hudRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  mapName: {
    fontFamily: theme.fonts.title,
    fontSize: '14px',
    fontWeight: 'bold',
    color: theme.colors.accent,
    textTransform: 'uppercase',
  },
  playerCount: {
    fontFamily: theme.fonts.body,
    fontSize: '12px',
    color: theme.colors.textSecondary,
  },
  canvasContainer: {
    position: 'absolute',
    top: '50px',
    left: 0,
    right: 0,
    bottom: 0,
  },
  minimap: {
    position: 'absolute',
    top: '60px',
    right: '10px',
    background: 'rgba(15, 15, 26, 0.8)',
    border: `1px solid ${theme.colors.borderMedium}`,
    borderRadius: '4px',
    padding: '4px',
    zIndex: 50,
  },
  minimapCanvas: {
    display: 'block',
    maxWidth: '80px',
    maxHeight: '100px',
  },
};
