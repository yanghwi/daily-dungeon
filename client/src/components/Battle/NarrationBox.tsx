import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';

/**
 * 하드코딩 서술 표시 — eb-window, 타이프라이터 효과, 탭하면 스킵
 */
export default function NarrationBox() {
  const narrative = useGameStore((s) => s.narrative);
  const damageResult = useGameStore((s) => s.damageResult);
  const enemy = useGameStore((s) => s.enemy);

  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  // 타이프라이터 효과
  useEffect(() => {
    if (!narrative) return;
    setDisplayedText('');
    setIsComplete(false);

    let index = 0;
    const interval = setInterval(() => {
      index++;
      if (index >= narrative.length) {
        setDisplayedText(narrative);
        setIsComplete(true);
        clearInterval(interval);
      } else {
        setDisplayedText(narrative.slice(0, index));
      }
    }, 30);

    return () => clearInterval(interval);
  }, [narrative]);

  // 탭하면 스킵
  const handleTap = useCallback(() => {
    if (!isComplete && narrative) {
      setDisplayedText(narrative);
      setIsComplete(true);
    }
  }, [isComplete, narrative]);

  if (!narrative) return null;

  return (
    <div className="flex-1 flex flex-col justify-center px-3" onClick={handleTap}>
      {/* 내러티브 텍스트 */}
      <div className="eb-window">
        <pre className="font-body text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
          {displayedText}
          {!isComplete && <span className="animate-pulse">|</span>}
        </pre>
      </div>

      {/* 데미지 요약 */}
      {isComplete && damageResult && (
        <div className="eb-window mt-2 !border-arcane animate-fade-in">
          <div className="flex justify-between items-center">
            <span className="font-body text-xs text-slate-400">
              {enemy?.name}에게 준 데미지
            </span>
            <span className="font-title text-sm text-tier-critical">
              {damageResult.enemyDamage}
            </span>
          </div>
          {damageResult.enemyDefeated && (
            <div className="font-title text-xs text-gold mt-1 text-center animate-pulse">
              DEFEATED!
            </div>
          )}
        </div>
      )}

      {isComplete && (
        <div className="text-center font-body text-[10px] text-slate-600 mt-2">
          잠시 후 다음 단계로...
        </div>
      )}
    </div>
  );
}
