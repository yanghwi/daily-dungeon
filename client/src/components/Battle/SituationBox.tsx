import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';

/**
 * 상황 묘사 타이프라이터 — 한 글자씩 출력, 탭하면 스킵
 */
export default function SituationBox() {
  const situation = useGameStore((s) => s.situation);
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!situation) return;
    setDisplayedText('');
    setIsComplete(false);

    let index = 0;
    const interval = setInterval(() => {
      index++;
      if (index >= situation.length) {
        setDisplayedText(situation);
        setIsComplete(true);
        clearInterval(interval);
      } else {
        setDisplayedText(situation.slice(0, index));
      }
    }, 30);

    return () => clearInterval(interval);
  }, [situation]);

  const handleTap = useCallback(() => {
    if (!isComplete && situation) {
      setDisplayedText(situation);
      setIsComplete(true);
    }
  }, [isComplete, situation]);

  if (!situation) return null;

  return (
    <div className="px-3 mt-2" onClick={handleTap}>
      <div className="eb-window">
        <pre className="font-body text-base text-slate-200 whitespace-pre-wrap leading-relaxed">
          {displayedText}
          {!isComplete && <span className="animate-pulse">|</span>}
        </pre>
      </div>
    </div>
  );
}
