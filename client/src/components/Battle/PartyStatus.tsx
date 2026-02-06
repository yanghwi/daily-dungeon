import { useGameStore } from '../../stores/gameStore';

/**
 * 4명 파티 HP 바 — 항시 표시
 * 임계값별 색상: green (>50%), gold (25-50%), red (<25%)
 */
export default function PartyStatus() {
  const room = useGameStore((s) => s.room);
  const partyStatus = useGameStore((s) => s.partyStatus);

  // 웨이브 중에는 partyStatus 사용, 아니면 room.players
  const players = partyStatus.length > 0
    ? partyStatus
    : (room?.players ?? []).map((p) => ({
        playerId: p.id,
        name: p.name,
        hp: p.hp,
        maxHp: p.maxHp,
      }));

  if (players.length === 0) return null;

  return (
    <div className="flex gap-1.5 px-3 py-2 z-10">
      {players.map((p) => {
        const ratio = p.maxHp > 0 ? p.hp / p.maxHp : 0;
        const barColor =
          ratio > 0.5 ? 'bg-tier-critical' :
          ratio > 0.25 ? 'bg-gold' :
          'bg-tier-nat1';
        const isLow = ratio <= 0.25 && ratio > 0;

        return (
          <div key={p.playerId} className="flex-1 eb-window !px-2 !py-1.5">
            <div className="font-title text-sm text-slate-200 truncate mb-1">
              {p.name || '???'}
            </div>
            <div className="h-3 bg-midnight-900 border border-slate-600 rounded-sm overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-out ${barColor} ${isLow ? 'animate-pulse' : ''}`}
                style={{ width: `${Math.max(0, ratio * 100)}%` }}
              />
            </div>
            <div className="font-body text-sm text-slate-400 mt-0.5 text-right">
              {p.hp}/{p.maxHp}
            </div>
          </div>
        );
      })}
    </div>
  );
}
