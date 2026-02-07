import { useRef, useEffect, useState } from 'react';
import { getWaveBackground } from './backgroundData';
import './backgroundAnimations.css';

interface Props {
  waveNumber: number;
  isBoss?: boolean;
  bossType?: 'mid' | 'final';
}

/**
 * 스테이지 기반 사이키델릭 배경
 * 레이어 구조: Base(midnight-900) → N개 효과 레이어 → Scanlines
 * 보스 전환 시 fade 트랜지션
 */
export default function BattleBackground({ waveNumber, isBoss = false, bossType }: Props) {
  const config = getWaveBackground(waveNumber, isBoss, bossType);
  const [transitioning, setTransitioning] = useState(false);
  const prevWave = useRef(waveNumber);

  // 웨이브 전환 시 fade 트랜지션
  useEffect(() => {
    if (prevWave.current !== waveNumber) {
      setTransitioning(true);
      const t = setTimeout(() => setTransitioning(false), 800);
      prevWave.current = waveNumber;
      return () => clearTimeout(t);
    }
  }, [waveNumber]);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{
        zIndex: 0,
        transition: 'opacity 0.8s ease-in-out',
        opacity: transitioning ? 0.3 : 1,
      }}
    >
      {/* 바닥: 어두운 배경 */}
      <div className="absolute inset-0 bg-midnight-900" />

      {/* 효과 레이어들 */}
      {config.layers.map((layer, i) => (
        <div
          key={`${waveNumber}-${i}`}
          className="absolute"
          style={{
            inset: layer.inset,
            background: layer.background,
            animation: layer.animation,
            opacity: layer.opacity,
          }}
        />
      ))}

      {/* 스캔라인 */}
      <div className="scanlines" />
    </div>
  );
}
