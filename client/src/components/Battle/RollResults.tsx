import { useGameStore } from '../../stores/gameStore';
import type { RollTier } from '@round-midnight/shared';

const TIER_STYLES: Record<RollTier, { bg: string; text: string; label: string }> = {
  nat20:    { bg: 'border-tier-nat20 shadow-[0_0_16px_rgba(251,191,36,0.4)]', text: 'text-tier-nat20', label: 'NAT 20!' },
  critical: { bg: 'border-tier-critical', text: 'text-tier-critical', label: 'CRITICAL' },
  normal:   { bg: 'border-tier-normal', text: 'text-tier-normal', label: 'HIT' },
  fail:     { bg: 'border-tier-fail', text: 'text-tier-fail', label: 'MISS' },
  nat1:     { bg: 'border-tier-nat1 shadow-[0_0_16px_rgba(239,68,68,0.4)]', text: 'text-tier-nat1', label: 'NAT 1...' },
};

/**
 * 4명 결과 표시 — 2x2 그리드, 티어별 색상, 스태거 진입
 */
export default function RollResults() {
  const allActions = useGameStore((s) => s.allActions);

  if (!allActions || allActions.length === 0) return null;

  return (
    <div className="flex-1 flex items-center justify-center px-3">
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        {allActions.map((action, i) => {
          const style = TIER_STYLES[action.tier];
          return (
            <div
              key={action.playerId}
              className={`eb-window !p-3 border-2 ${style.bg} animate-slide-up`}
              style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}
            >
              <div className="font-title text-[9px] text-slate-300 truncate">
                {action.playerName}
              </div>
              <div className="font-body text-[10px] text-slate-500 truncate mt-0.5">
                {action.choiceText}
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className={`font-title text-2xl ${style.text}`}>
                  {action.roll}
                </span>
                {action.bonus > 0 && (
                  <span className="font-body text-xs text-arcane-light">+{action.bonus}</span>
                )}
              </div>
              <div className={`font-title text-[10px] mt-1 ${style.text}`}>
                {style.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
