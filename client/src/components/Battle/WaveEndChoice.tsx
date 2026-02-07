import { useGameStore } from '../../stores/gameStore';

interface Props {
  onVote: (decision: 'continue' | 'retreat') => void;
}

/**
 * 웨이브 종료 — 전리품 표시 + 계속/철수 투표
 */
export default function WaveEndChoice({ onVote }: Props) {
  const canContinue = useGameStore((s) => s.canContinue);
  const loot = useGameStore((s) => s.loot);
  const hasVoted = useGameStore((s) => s.hasVoted);
  const setHasVoted = useGameStore((s) => s.setHasVoted);
  const nextWavePreview = useGameStore((s) => s.nextWavePreview);
  const partyStatus = useGameStore((s) => s.partyStatus);
  const voteStatus = useGameStore((s) => s.voteStatus);

  const handleVote = (decision: 'continue' | 'retreat') => {
    if (hasVoted) return;
    setHasVoted(true);
    onVote(decision);
  };

  return (
    <div className="flex-1 flex flex-col justify-end px-3 pb-4 gap-3">
      {/* 파티 상태 요약 */}
      <div className="eb-window">
        <div className="font-title text-sm text-gold mb-2">파티 상태</div>
        <div className="space-y-1">
          {partyStatus.map((p) => {
            const ratio = p.maxHp > 0 ? p.hp / p.maxHp : 0;
            const color = ratio > 0.5 ? 'text-tier-critical' : ratio > 0.25 ? 'text-gold' : 'text-tier-nat1';
            return (
              <div key={p.playerId} className="flex justify-between font-body text-sm">
                <span className="text-slate-300">{p.name}</span>
                <span className={color}>{p.hp}/{p.maxHp}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 전리품 */}
      {loot.length > 0 && (
        <div className="eb-window !border-gold animate-fade-in">
          <div className="font-title text-sm text-gold mb-1">전리품!</div>
          {loot.map((item, i) => (
            <div key={i} className="font-body text-sm text-slate-200">
              {item.name} — <span className="text-slate-400">{item.effect}</span>
            </div>
          ))}
        </div>
      )}

      {/* 다음 웨이브 미리보기 */}
      {nextWavePreview && canContinue && (
        <div className="font-body text-sm text-slate-500 text-center italic">
          {nextWavePreview}
        </div>
      )}

      {/* 투표 버튼 */}
      {!hasVoted ? (
        <div className="flex gap-2">
          {canContinue ? (
            <>
              <button
                onClick={() => handleVote('continue')}
                className="flex-1 eb-window !border-tier-critical text-center active:scale-[0.97] transition-transform"
              >
                <div className="font-title text-base text-tier-critical">계속 전진</div>
                <div className="font-body text-sm text-slate-500">다음 웨이브로</div>
              </button>
              <button
                onClick={() => handleVote('retreat')}
                className="flex-1 eb-window !border-tier-fail text-center active:scale-[0.97] transition-transform"
              >
                <div className="font-title text-base text-tier-fail">철수</div>
                <div className="font-body text-sm text-slate-500">전리품 챙기고 나가기</div>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleVote('continue')}
              className="w-full eb-window !border-gold text-center active:scale-[0.97] transition-transform"
            >
              <div className="font-title text-base text-gold">계속 전투</div>
              <div className="font-body text-sm text-slate-500">같은 적과 재도전</div>
            </button>
          )}
        </div>
      ) : (
        <div className="text-center space-y-1">
          <div className="font-body text-sm text-slate-400 animate-pulse">
            투표 완료! 결과를 기다리는 중...
          </div>
          {voteStatus && (
            <div className="font-body text-sm text-slate-500">
              전진 {voteStatus.continueCount} / 철수 {voteStatus.retreatCount} ({voteStatus.total}명 중 {voteStatus.continueCount + voteStatus.retreatCount}명 투표)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
