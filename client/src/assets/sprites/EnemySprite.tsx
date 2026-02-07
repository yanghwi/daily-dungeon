import SPRITES from './spriteData';
import './spriteAnimations.css';

interface Props {
  imageTag: string;
  /** 'idle' | 'hit' | 'defeat' */
  state?: 'idle' | 'hit' | 'defeat';
  /** 보스 여부 — true 시 scale 오버라이드 (7~8) */
  isBoss?: boolean;
}

/**
 * 적 스프라이트 렌더러 — box-shadow 픽셀아트
 *
 * 3단 div wrapper로 transform 충돌 방지:
 *   outer: scale (반응형 크기)
 *   mid:   idle/hit/defeat 애니메이션
 *   inner: box-shadow 렌더링 (4px base element)
 */
export default function EnemySprite({ imageTag, state = 'idle', isBoss = false }: Props) {
  const sprite = SPRITES[imageTag];
  if (!sprite) return null;

  const { boxShadow, idleAnimation, idleDuration, idleSteps, scale: baseScale } = sprite;
  const scale = isBoss ? Math.max(baseScale, 7) : baseScale;

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

  return (
    <div
      className="flex items-center justify-center py-4"
      style={{ transform: `scale(${scale})` }}
    >
      <div style={{ animation }}>
        <div
          style={{
            width: 4,
            height: 4,
            background: 'transparent',
            boxShadow,
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  );
}
