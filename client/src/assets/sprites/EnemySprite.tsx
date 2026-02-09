import { useState } from 'react';
import SPRITES from './spriteData';
import './spriteAnimations.css';

interface Props {
  imageTag: string;
  /** 'idle' | 'hit' | 'defeat' */
  state?: 'idle' | 'hit' | 'defeat';
  /** 보스 여부 — true 시 scale 오버라이드 */
  isBoss?: boolean;
}

/** PNG 스프라이트 기본 표시 크기 (CSS px) */
const SPRITE_SIZE = 160;
const BOSS_SIZE = 200;

/**
 * 적 스프라이트 렌더러
 *
 * 1차: /sprites/{imageTag}.png 이미지 로드 시도
 * 2차: 로드 실패 시 box-shadow 픽셀아트 폴백
 */
export default function EnemySprite({ imageTag, state = 'idle', isBoss = false }: Props) {
  const sprite = SPRITES[imageTag] ?? SPRITES['raccoon'];
  const [imgFailed, setImgFailed] = useState(false);

  const { boxShadow, idleAnimation, idleDuration, idleSteps, scale: baseScale, visualWidth, visualHeight } = sprite;

  // 애니메이션 결정
  let animation: string;
  if (state === 'hit') {
    animation = 'sprite-hit 0.4s steps(4) forwards';
  } else if (state === 'defeat') {
    animation = 'sprite-defeat 0.6s ease-out forwards';
  } else {
    const timing = idleSteps ? `steps(${idleSteps})` : 'ease-in-out';
    animation = `${idleAnimation} ${idleDuration} ${timing} infinite`;
  }

  // --- PNG 이미지 모드 ---
  if (!imgFailed) {
    const size = isBoss ? BOSS_SIZE : SPRITE_SIZE;
    return (
      <div className="flex items-center justify-center py-6">
        <div className="sprite-animate" style={{ animation }}>
          <img
            src={`/sprites/${imageTag}.png`}
            alt={imageTag}
            onError={() => setImgFailed(true)}
            style={{
              width: size,
              height: size,
              imageRendering: 'pixelated',
              objectFit: 'contain',
            }}
            draggable={false}
          />
        </div>
      </div>
    );
  }

  // --- box-shadow 폴백 모드 (기존 로직) ---
  const scale = isBoss ? Math.max(baseScale, 7) : baseScale;

  return (
    <div className="flex items-center justify-center py-6">
      <div style={{
        width: visualWidth * scale,
        height: visualHeight * scale,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
          <div style={{ animation }}>
            <div
              style={{
                width: 4,
                height: 4,
                background: 'transparent',
                boxShadow,
                imageRendering: 'pixelated',
                transform: `translate(-${visualWidth / 2}px, -${visualHeight / 2}px)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
