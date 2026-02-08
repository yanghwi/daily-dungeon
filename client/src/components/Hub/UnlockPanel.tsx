import { useState, useEffect } from 'react';
import { apiGetUnlocksAll } from '../../hooks/useApi';

interface UnlockItem {
  id: string;
  type: string;
  name: string;
  description: string;
  condition: { type: string; count?: number; level?: number; boss?: string };
  reward?: { type: string; title?: string };
  unlocked: boolean;
  unlockedAt: string | null;
}

const TYPE_ICONS: Record<string, string> = {
  passive: '[P]',
  title: '[T]',
  background: '[BG]',
  cosmetic: '[C]',
  startItem: '[S]',
};

const CONDITION_LABELS: Record<string, (c: any) => string> = {
  clears: (c) => `${c.count}회 클리어`,
  runs: (c) => `${c.count}회 참가`,
  bossKill: (c) => `보스 처치`,
  noDamageBoss: (c) => `보스 무피해`,
  dailyClears: (c) => `데일리 ${c.count}회`,
  wavesTotal: (c) => `누적 ${c.count} 웨이브`,
  level: (c) => `레벨 ${c.level} 달성`,
};

export default function UnlockPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<UnlockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetUnlocksAll()
      .then((data) => setItems(data.unlockables))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unlockedCount = items.filter((i) => i.unlocked).length;

  return (
    <div className="eb-window">
      <div className="flex items-center justify-between mb-3">
        <span className="font-title text-sm text-gold">
          도전 ({unlockedCount}/{items.length})
        </span>
        <button onClick={onClose} className="font-body text-xs text-slate-400">닫기</button>
      </div>

      {loading ? (
        <div className="font-body text-xs text-slate-500 text-center py-4 animate-pulse">
          로딩 중...
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item) => {
            const condLabel = CONDITION_LABELS[item.condition.type]?.(item.condition) ?? '???';
            return (
              <div
                key={item.id}
                className={`flex items-start gap-2 px-2 py-1.5 rounded border ${
                  item.unlocked
                    ? 'border-gold/50 bg-gold/5'
                    : 'border-slate-700 bg-midnight-800/30 opacity-60'
                }`}
              >
                <span className={`font-body text-[10px] mt-0.5 ${item.unlocked ? 'text-gold' : 'text-slate-600'}`}>
                  {TYPE_ICONS[item.type] ?? '[?]'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-body text-xs font-bold ${item.unlocked ? 'text-white' : 'text-slate-400'}`}>
                      {item.name}
                    </span>
                    {item.unlocked && (
                      <span className="font-body text-[10px] text-tier-critical">UNLOCKED</span>
                    )}
                  </div>
                  <div className="font-body text-[10px] text-slate-500">{item.description}</div>
                  <div className={`font-body text-[10px] mt-0.5 ${item.unlocked ? 'text-slate-500' : 'text-arcane-light'}`}>
                    {condLabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
