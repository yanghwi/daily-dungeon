import { useState, useEffect, useCallback } from 'react';
import { GAME_CONSTANTS } from '@round-midnight/shared';

interface Props {
  onRoll: () => void;
}

/**
 * 탭하여 주사위 굴리기 — 전체화면 탭 영역
 * steps(12) 스핀 애니메이션으로 숫자 회전 효과
 */
export default function DiceRoll({ onRoll }: Props) {
  const [hasRolled, setHasRolled] = useState(false);
  const [displayNumber, setDisplayNumber] = useState(1);
  const [isSpinning, setIsSpinning] = useState(true);
  const [countdown, setCountdown] = useState(GAME_CONSTANTS.DICE_ROLL_TIMEOUT / 1000);

  // 스핀 애니메이션: 랜덤 숫자 순환
  useEffect(() => {
    if (!isSpinning) return;
    const interval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 20) + 1);
    }, 80);
    return () => clearInterval(interval);
  }, [isSpinning]);

  // 카운트다운
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTap = useCallback(() => {
    if (hasRolled) return;
    setHasRolled(true);
    setIsSpinning(false);
    onRoll();
  }, [hasRolled, onRoll]);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center cursor-pointer select-none"
      onClick={handleTap}
    >
      {/* d20 주사위 표시 */}
      <div
        className={`
          w-28 h-28 flex items-center justify-center
          border-4 rounded-2xl
          ${hasRolled
            ? 'border-gold bg-midnight-700'
            : 'border-arcane bg-midnight-800 animate-pulse-glow'
          }
          transition-all duration-300
        `}
      >
        <span
          className={`
            font-title text-2xl xs:text-3xl sm:text-4xl
            ${hasRolled ? 'text-gold' : 'text-arcane-light'}
          `}
        >
          {displayNumber}
        </span>
      </div>

      {/* 안내 */}
      <div className="mt-6 text-center">
        {!hasRolled ? (
          <>
            <div className="font-title text-sm text-gold animate-pulse">탭하여 굴리기!</div>
            <div className="font-body text-xs text-slate-500 mt-1">{countdown}초 남음</div>
          </>
        ) : (
          <div className="font-body text-sm text-slate-400 animate-pulse">
            다른 플레이어를 기다리는 중...
          </div>
        )}
      </div>
    </div>
  );
}
