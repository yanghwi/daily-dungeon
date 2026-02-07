import { useGameStore } from '../../stores/gameStore';

interface Props {
  onReturnToLobby: () => void;
}

const RESULT_THEME = {
  clear: {
    title: 'CLEAR!',
    titleColor: 'text-gold',
    border: '!border-gold',
    bgGlow: 'shadow-[0_0_30px_rgba(251,191,36,0.2)]',
    subtitle: '야시장의 주인을 물리쳤다!',
  },
  retreat: {
    title: 'RETREAT',
    titleColor: 'text-tier-fail',
    border: '!border-tier-fail',
    bgGlow: '',
    subtitle: '현명한 후퇴도 용기다.',
  },
  wipe: {
    title: 'WIPE OUT',
    titleColor: 'text-tier-nat1',
    border: '!border-tier-nat1',
    bgGlow: 'shadow-[0_0_30px_rgba(239,68,68,0.2)]',
    subtitle: '모두 쓰러졌다...',
  },
};

/**
 * 런 종료 화면 — clear/retreat/wipe 테마별
 */
export default function RunResult({ onReturnToLobby }: Props) {
  const runEndResult = useGameStore((s) => s.runEndResult);

  if (!runEndResult) return null;

  const theme = RESULT_THEME[runEndResult.result];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
      {/* 타이틀 */}
      <div className={`eb-window ${theme.border} ${theme.bgGlow} text-center w-full max-w-sm animate-slide-up`}>
        <div className={`font-title text-2xl ${theme.titleColor}`}>
          {theme.title}
        </div>
        <div className="font-body text-sm text-slate-400 mt-1">
          {theme.subtitle}
        </div>
      </div>

      {/* 하이라이트 */}
      <div className="eb-window w-full max-w-sm animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
        <div className="font-title text-sm text-arcane-light mb-2">하이라이트</div>
        {runEndResult.highlights.map((line, i) => (
          <div key={i} className="font-body text-sm text-slate-300 leading-relaxed">
            {line}
          </div>
        ))}
      </div>

      {/* 전리품 */}
      {runEndResult.totalLoot.length > 0 && (
        <div className="eb-window !border-gold w-full max-w-sm animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
          <div className="font-title text-sm text-gold mb-1">획득 전리품</div>
          {runEndResult.totalLoot.map((item, i) => (
            <div key={i} className="font-body text-sm text-slate-200">
              {item.name}
            </div>
          ))}
        </div>
      )}

      {/* 새 해금 알림 */}
      {runEndResult.newUnlocks && runEndResult.newUnlocks.length > 0 && (
        <div className="eb-window !border-gold w-full max-w-sm animate-slide-up" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
          <div className="font-title text-sm text-gold mb-1">NEW UNLOCK!</div>
          {runEndResult.newUnlocks.map((id, i) => (
            <div key={i} className="font-body text-sm text-arcane-light">
              {id}
            </div>
          ))}
        </div>
      )}

      {/* 로비 복귀 */}
      <button
        onClick={onReturnToLobby}
        className="eb-window !border-arcane text-center w-full max-w-sm active:scale-[0.97] transition-transform animate-slide-up"
        style={{ animationDelay: '800ms', animationFillMode: 'both' }}
      >
        <div className="font-title text-base text-arcane-light">로비로 돌아가기</div>
      </button>
    </div>
  );
}
