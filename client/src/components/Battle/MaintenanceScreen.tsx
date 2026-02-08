import { useGameStore } from '../../stores/gameStore';
import type { ItemRarity, InventoryItemDisplay, ActiveSynergy } from '@round-midnight/shared';
import { GAME_CONSTANTS } from '@round-midnight/shared';
import { RARITY_COLORS, RARITY_BORDERS, RARITY_LABELS, TYPE_LABELS } from '../../styles/itemStyles';

interface Props {
  onVote: (decision: 'continue') => void;
  onEquipItem?: (itemId: string) => void;
  onUnequipItem?: (itemId: string) => void;
  onUseConsumable?: (itemId: string) => void;
  onDiscardItem?: (itemId: string) => void;
}

const EQUIP_SLOTS = ['weapon', 'top', 'bottom', 'hat', 'accessory'] as const;
const RARITY_RANK: Record<ItemRarity, number> = { legendary: 0, rare: 1, uncommon: 2, common: 3 };

/**
 * 인벤토리를 "장착 빌드 → 교체 후보 → 소모품" 순서로 그룹핑.
 *
 * - "현재 빌드": 장착 중 아이템 + 빈 슬롯 힌트 (placeholder)
 * - 타입별 미장착 장비: 레어리티 내림차순
 * - "소모품": 별도 섹션
 */
function groupAndSortInventory(inventory: InventoryItemDisplay[]): Record<string, InventoryItemDisplay[]> {
  const byRarity = (a: InventoryItemDisplay, b: InventoryItemDisplay) =>
    RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity];

  const result: Record<string, InventoryItemDisplay[]> = {};

  // 1) 현재 빌드 — 장착 중인 아이템을 슬롯 순서대로, 빈 슬롯은 placeholder
  const equipped: InventoryItemDisplay[] = [];
  for (const slot of EQUIP_SLOTS) {
    const found = inventory.find((i) => i.type === slot && i.equipped);
    if (found) {
      equipped.push(found);
    } else {
      // 빈 슬롯 placeholder
      equipped.push({
        itemId: `__empty_${slot}`,
        equipped: false,
        name: `(${TYPE_LABELS[slot]} 없음)`,
        type: slot,
        rarity: 'common',
        effect: '장착 가능한 아이템이 없습니다',
        flavorText: '',
      });
    }
  }
  result['현재 빌드'] = equipped;

  // 2) 타입별 미장착 장비 — 레어리티 내림차순
  for (const slot of EQUIP_SLOTS) {
    const unequipped = inventory
      .filter((i) => i.type === slot && !i.equipped)
      .sort(byRarity);
    if (unequipped.length > 0) {
      result[`${TYPE_LABELS[slot]} 교체`] = unequipped;
    }
  }

  // 3) 소모품 — 레어리티 내림차순
  const consumables = inventory
    .filter((i) => i.type === 'consumable')
    .sort(byRarity);
  if (consumables.length > 0) {
    result['소모품'] = consumables;
  }

  return result;
}

/**
 * 정비 세션 — 장비 관리 (기본 열림) + 활성 버프 + 계속/철수 투표
 */
export default function MaintenanceScreen({ onVote, onEquipItem, onUnequipItem, onUseConsumable, onDiscardItem }: Props) {
  const hasVoted = useGameStore((s) => s.hasVoted);
  const setHasVoted = useGameStore((s) => s.setHasVoted);
  const nextWavePreview = useGameStore((s) => s.nextWavePreview);
  const partyStatus = useGameStore((s) => s.partyStatus);
  const inventory = useGameStore((s) => s.inventory);
  const activeBuffs = useGameStore((s) => s.activeBuffs);
  const activeSynergies = useGameStore((s) => s.activeSynergies);

  const inventoryFull = inventory.length >= GAME_CONSTANTS.MAX_RUN_INVENTORY;
  const groupedInventory = groupAndSortInventory(inventory);

  const handleVote = (decision: 'continue') => {
    if (hasVoted) return;
    setHasVoted(true);
    onVote(decision);
  };

  return (
    <div className="flex-1 flex flex-col justify-end px-3 pb-4 gap-3 overflow-y-auto">
      {/* 정비 세션 헤더 */}
      <div className="text-center">
        <div className="font-title text-sm text-gold">정비 시간</div>
        <div className="font-body text-xs text-slate-500 mt-1">장비를 정비하고 다음 전투를 준비하세요</div>
      </div>

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

      {/* 활성 시너지 */}
      {activeSynergies.length > 0 && (
        <div className="eb-window !border-gold/50 animate-fade-in">
          <div className="font-title text-xs text-gold mb-1.5">빌드 시너지</div>
          <div className="space-y-1">
            {activeSynergies.map((syn) => {
              const isActive = syn.count >= syn.threshold;
              return (
                <div key={syn.tag} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-body text-xs font-bold ${isActive ? 'text-gold' : 'text-slate-500'}`}>
                      {syn.name}
                    </span>
                    <span className={`font-body text-[10px] ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                      ({syn.count}/{syn.threshold})
                    </span>
                  </div>
                  {isActive && (
                    <span className="font-body text-[10px] text-tier-critical">{syn.bonusDescription}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 활성 버프 */}
      {activeBuffs.length > 0 && (
        <div className="eb-window !border-arcane animate-fade-in">
          <div className="font-title text-xs text-arcane-light mb-1.5">임시 버프</div>
          <div className="flex flex-wrap gap-1.5">
            {activeBuffs.map((buff, i) => {
              const label = buff.effect.type === 'stat_bonus'
                ? buff.effect.stat === 'weaponBonus' ? `공격력 +${buff.effect.value}` : `방어력 +${buff.effect.value}`
                : '효과';
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-arcane/50 bg-arcane/10 font-body text-xs text-tier-critical"
                >
                  {label}
                  <span className="text-slate-500">{buff.remainingWaves}턴</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 인벤토리 — 기본 열림 */}
      <div className="eb-window">
        <div className={`font-title text-sm mb-3 ${inventoryFull ? 'text-tier-nat1' : 'text-arcane-light'}`}>
          인벤토리 ({inventory.length}/{GAME_CONSTANTS.MAX_RUN_INVENTORY})
        </div>

        {inventory.length === 0 ? (
          <div className="font-body text-xs text-slate-600 text-center py-2">
            아이템이 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedInventory).map(([groupName, items]) => (
              <div key={groupName}>
                <div className="font-title text-xs text-slate-500 mb-1.5">{groupName}</div>
                <div className="space-y-1.5">
                  {items.map((item, i) => {
                    const isEmpty = item.itemId.startsWith('__empty_');
                    if (isEmpty) {
                      return (
                        <div key={item.itemId} className="flex items-center gap-2 px-2 py-1.5 rounded border border-dashed border-slate-700 bg-midnight-800/30 opacity-40">
                          <span className="font-body text-xs text-slate-600">{item.name}</span>
                        </div>
                      );
                    }
                    return (
                      <InventoryRow
                        key={`${item.itemId}-${i}`}
                        item={item}
                        onEquip={onEquipItem}
                        onUnequip={onUnequipItem}
                        onUse={onUseConsumable}
                        onDiscard={onDiscardItem}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 다음 웨이브 미리보기 */}
      {nextWavePreview && (
        <div className="font-body text-sm text-slate-500 text-center italic">
          {nextWavePreview}
        </div>
      )}

      {/* 준비 완료 버튼 */}
      {!hasVoted ? (
        <button
          onClick={() => handleVote('continue')}
          className="w-full eb-window !border-tier-critical text-center active:scale-[0.97] transition-transform"
        >
          <div className="font-title text-base text-tier-critical">준비 완료</div>
          <div className="font-body text-sm text-slate-500">다음 웨이브로 진행</div>
        </button>
      ) : (
        <div className="text-center">
          <div className="font-body text-sm text-slate-400 animate-pulse">
            다른 플레이어를 기다리는 중...
          </div>
        </div>
      )}
    </div>
  );
}

function InventoryRow({
  item,
  onEquip,
  onUnequip,
  onUse,
  onDiscard,
}: {
  item: InventoryItemDisplay;
  onEquip?: (itemId: string) => void;
  onUnequip?: (itemId: string) => void;
  onUse?: (itemId: string) => void;
  onDiscard?: (itemId: string) => void;
}) {
  const colorClass = RARITY_COLORS[item.rarity];
  const borderClass = RARITY_BORDERS[item.rarity];
  const isConsumable = item.type === 'consumable';

  return (
    <div className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded border ${borderClass} bg-midnight-800/50`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-body text-xs font-bold ${colorClass}`}>{item.name}</span>
          <span className={`font-body text-xs ${colorClass} opacity-60`}>[{RARITY_LABELS[item.rarity]}]</span>
          {item.equipped && (
            <span className="font-body text-xs text-tier-critical">✓</span>
          )}
        </div>
        <div className="font-body text-xs text-slate-600 truncate">{item.effect}</div>
      </div>
      {isConsumable && onUse && (
        <button
          onClick={() => onUse(item.itemId)}
          className="font-body text-xs px-2 py-0.5 rounded border border-tier-critical text-tier-critical active:scale-95 transition-transform shrink-0"
        >
          사용
        </button>
      )}
      {!isConsumable && item.equipped && onUnequip && (
        <button
          onClick={() => onUnequip(item.itemId)}
          className="font-body text-xs px-2 py-0.5 rounded border border-slate-500 text-slate-400 active:scale-95 transition-transform shrink-0"
        >
          해제
        </button>
      )}
      {!isConsumable && !item.equipped && onEquip && (
        <button
          onClick={() => onEquip(item.itemId)}
          className="font-body text-xs px-2 py-0.5 rounded border border-arcane text-arcane-light active:scale-95 transition-transform shrink-0"
        >
          장착
        </button>
      )}
      {onDiscard && (
        <button
          onClick={() => onDiscard(item.itemId)}
          className="font-body text-xs px-1.5 py-0.5 rounded border border-slate-700 text-slate-600 active:scale-95 transition-transform shrink-0"
        >
          버리기
        </button>
      )}
    </div>
  );
}
