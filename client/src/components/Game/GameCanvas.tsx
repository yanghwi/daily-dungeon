import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Phaser from 'phaser';
import { createPhaserConfig } from '../../phaser/config';
import { ExploreScene } from '../../phaser/scenes/ExploreScene';
import type { Position, Player, DungeonTile, TileContent } from '@daily-dungeon/shared';

interface GameCanvasProps {
  playerId: string;
  players: Player[];
  dungeonTiles: DungeonTile[][];
  onMove: (position: Position) => void;
  onEncounterMonster: (monsterId: string, monsterPos: Position) => void;
  isCombatActive: boolean;
  onPositionsUpdate?: (positions: { playerId: string; position: Position }[]) => void;
}

// 외부에서 호출 가능한 메서드
export interface GameCanvasHandle {
  removeMonster: (monsterId: string) => void;
  updateTileContent: (position: Position, content: TileContent | null) => void;
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function GameCanvas(
  {
    playerId,
    players,
    dungeonTiles,
    onMove,
    onEncounterMonster,
    isCombatActive,
  },
  ref
) {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<ExploreScene | null>(null);

  // 외부에서 호출 가능한 메서드 노출
  useImperativeHandle(ref, () => ({
    removeMonster: (monsterId: string) => {
      sceneRef.current?.removeMonster(monsterId);
    },
    updateTileContent: (position: Position, content: TileContent | null) => {
      const { x, y } = position;
      if (sceneRef.current) {
        // 타일 업데이트
        sceneRef.current.updateTile(x, y, {
          ...dungeonTiles[y][x],
          content,
        });
      }
    },
  }), [dungeonTiles]);

  useEffect(() => {
    if (!gameContainerRef.current || gameRef.current) return;

    // Phaser 게임 생성
    const config = createPhaserConfig(gameContainerRef.current);
    const game = new Phaser.Game(config);
    gameRef.current = game;

    // 씬 추가 및 시작
    game.events.on('ready', () => {
      // 씬을 수동으로 추가하고 시작
      game.scene.add('ExploreScene', ExploreScene, true, {
        playerId,
        players,
        dungeonTiles,
        onMove,
        onEncounterMonster,
      });

      // 씬 참조 저장
      const scene = game.scene.getScene('ExploreScene') as ExploreScene;
      if (scene) {
        sceneRef.current = scene;
      }
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  // 플레이어 위치 업데이트 (외부에서 호출)
  useEffect(() => {
    if (sceneRef.current) {
      for (const player of players) {
        if (player.id !== playerId) {
          sceneRef.current.updatePlayerPosition(player.id, player.position);
        }
      }
    }
  }, [players, playerId]);

  // 전투 상태 동기화
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setCombatActive(isCombatActive);
    }
  }, [isCombatActive]);

  return (
    <div
      ref={gameContainerRef}
      style={styles.container}
    />
  );
});

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    touchAction: 'none',
  },
};
