import { useGameStore } from '../../stores/gameStore';
import type { LootItem } from '@round-midnight/shared';
import { RARITY_COLORS, RARITY_BORDERS, RARITY_LABELS } from '../../styles/itemStyles';

/**
 * 웨이브 종료 — 전리품 표시만 (3초간, 이후 maintenance로 전환)
 */
export default function WaveEndChoice() {
  const loot = useGameStore((s) => s.loot);
  const player = useGameStore((s) => s.player);
  const partyStatus = useGameStore((s) => s.partyStatus);

  const myLoot = loot.filter((l) => !l.assignedTo || l.assignedTo === player?.name);
  const otherLoot = loot.filter((l) => l.assignedTo && l.assignedTo !== player?.name);

  return (
    <div className="flex-1 flex flex-col justify-end px-3 pb-4 gap-3 overflow-y-auto">
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

      {/* 나의 전리품 */}
      {myLoot.length > 0 && (
        <div className="eb-window !border-gold animate-fade-in">
          <div className="font-title text-sm text-gold mb-2">전리품 획득!</div>
          <div className="space-y-2">
            {myLoot.map((item, i) => (
              <LootCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* 동료의 전리품 */}
      {otherLoot.length > 0 && (
        <div className="eb-window animate-fade-in">
          <div className="font-title text-sm text-slate-400 mb-2">동료의 전리품</div>
          <div className="space-y-1">
            {otherLoot.map((item, i) => (
              <div key={i} className="flex items-center gap-2 font-body text-xs text-slate-500">
                <span className={RARITY_COLORS[item.rarity]}>{item.name}</span>
                <span className="text-slate-600">→ {item.assignedTo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 정비 전환 안내 */}
      <div className="text-center">
        <div className="font-body text-sm text-slate-400 animate-pulse">
          정비 시간으로 이동 중...
        </div>
      </div>
    </div>
  );
}

function LootCard({ item }: { item: LootItem }) {
  const rarity = item.rarity ?? 'common';
  const colorClass = RARITY_COLORS[rarity];
  const borderClass = RARITY_BORDERS[rarity];
  const label = RARITY_LABELS[rarity];

  return (
    <div className={`flex items-center gap-2 p-2 rounded border ${borderClass} bg-midnight-800/50`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-body text-sm font-bold ${colorClass}`}>{item.name}</span>
          <span className={`font-body text-xs ${colorClass} opacity-70`}>[{label}]</span>
        </div>
        <div className="font-body text-xs text-slate-500 truncate">{item.effect}</div>
      </div>
      {item.inventoryFull && (
        <span className="font-body text-xs text-tier-nat1 shrink-0">가방 풀!</span>
      )}
    </div>
  );
}
