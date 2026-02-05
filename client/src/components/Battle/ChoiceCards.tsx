import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { GAME_CONSTANTS } from '@round-midnight/shared';

interface Props {
  onSubmitChoice: (choiceId: string) => void;
}

/**
 * 선택지 카드 — 2~3개 선택지, 10초 카운트다운
 */
export default function ChoiceCards({ onSubmitChoice }: Props) {
  const myChoices = useGameStore((s) => s.myChoices);
  const mySelectedChoiceId = useGameStore((s) => s.mySelectedChoiceId);
  const setMyChoice = useGameStore((s) => s.setMyChoice);
  const [countdown, setCountdown] = useState(GAME_CONSTANTS.CHOICE_TIMEOUT / 1000);

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

  if (!myChoices) return null;

  const handleSelect = (choiceId: string) => {
    if (mySelectedChoiceId) return; // 이미 선택함
    setMyChoice(choiceId);
    onSubmitChoice(choiceId);
  };

  const categoryIcon: Record<string, string> = {
    physical: 'ATK',
    defensive: 'DEF',
    technical: 'TEC',
    creative: 'CRE',
    social: 'SOC',
  };

  return (
    <div className="flex-1 flex flex-col justify-end px-3 pb-4 gap-2">
      {/* 카운트다운 */}
      <div className="flex items-center gap-2 px-1 mb-1">
        <div className="font-title text-[10px] text-gold">어떻게 할까?</div>
        <div className="flex-1 h-1.5 bg-midnight-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-arcane transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / (GAME_CONSTANTS.CHOICE_TIMEOUT / 1000)) * 100}%` }}
          />
        </div>
        <div className="font-body text-xs text-slate-400">{countdown}s</div>
      </div>

      {/* 선택지 카드들 */}
      {myChoices.options.map((option) => {
        const isSelected = mySelectedChoiceId === option.id;
        const isDisabled = mySelectedChoiceId !== null && !isSelected;

        return (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            disabled={isDisabled}
            className={`
              eb-window text-left transition-all duration-200
              ${isSelected
                ? '!border-gold shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                : isDisabled
                  ? 'opacity-40'
                  : 'active:scale-[0.97]'
              }
            `}
          >
            <div className="flex items-start gap-2">
              <span className="font-title text-[8px] text-arcane-light bg-midnight-900 px-1.5 py-0.5 rounded">
                {categoryIcon[option.category] ?? '???'}
              </span>
              <span className="font-body text-sm text-slate-100 leading-snug">
                {option.text}
              </span>
            </div>
          </button>
        );
      })}

      {mySelectedChoiceId && (
        <div className="text-center font-body text-xs text-slate-500 animate-pulse">
          다른 플레이어를 기다리는 중...
        </div>
      )}
    </div>
  );
}
