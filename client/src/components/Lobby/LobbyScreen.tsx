import { useState } from 'react';
import type { Room, Character, InventoryItemDisplay, ItemRarity } from '@round-midnight/shared';
import { GAME_CONSTANTS } from '@round-midnight/shared';
import { useGameStore } from '../../stores/gameStore';
import LobbyBg from './LobbyBg';

interface LobbyProps {
  mode: 'room';
  room: Room;
  player: Character;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export default function LobbyScreen(props: LobbyProps) {
  return (
    <RoomView
      room={props.room}
      player={props.player}
      onStartGame={props.onStartGame}
      onLeaveRoom={props.onLeaveRoom}
    />
  );
}

// ===== 대기실 화면 =====

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: 'text-slate-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  legendary: 'text-gold',
};

const TYPE_LABELS: Record<string, string> = {
  weapon: '무기',
  top: '상의',
  bottom: '하의',
  hat: '모자',
  accessory: '악세서리',
  consumable: '소모품',
};

function RoomView({
  room,
  player,
  onStartGame,
  onLeaveRoom,
}: {
  room: Room;
  player: Character;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}) {
  const isHost = player.id === room.hostId;
  const playerCount = room.players.length;
  const maxPlayers = GAME_CONSTANTS.MAX_PLAYERS;
  const [showCharPanel, setShowCharPanel] = useState(false);
  const inventory = useGameStore((s) => s.inventory);
  const equipment = useGameStore((s) => s.equipment);

  const startButtonText = playerCount <= 1 ? '게임 시작' : '게임 시작';

  return (
    <div className="flex-1 flex flex-col px-6 py-8 gap-6 relative min-h-dvh">
      <LobbyBg />

      {/* 방 코드 */}
      <div className="text-center relative z-10">
        <p className="font-body text-sm text-slate-400 mb-2">방 코드</p>
        <div className="eb-window inline-block !px-6 !py-3">
          <p className="font-title text-2xl sm:text-3xl text-gold tracking-[0.2em] sm:tracking-[0.3em] lobby-title" style={{ animationDuration: '4s' }}>
            {room.code}
          </p>
        </div>
        <p className="font-body text-xs text-slate-500 mt-2">친구에게 이 코드를 알려주세요</p>
      </div>

      {/* 참가자 목록 */}
      <div className="flex-1 relative z-10">
        <p className="font-body text-sm text-slate-400 mb-3">
          참가자 ({playerCount}/{maxPlayers})
        </p>
        <div className="flex flex-col gap-2">
          {room.players.map((p) => (
            <div
              key={p.id}
              className={`eb-window flex items-center gap-3 ${
                p.id === player.id
                  ? '!border-arcane-light'
                  : '!border-slate-600'
              }`}
            >
              <span className="font-body text-lg">
                {p.id === room.hostId ? '★' : '●'}
              </span>
              <span className="font-body text-white flex-1">
                {p.name}
                {p.id === player.id && (
                  <span className="text-arcane-light text-xs ml-2">(나)</span>
                )}
              </span>
              {p.id === room.hostId && (
                <span className="font-body text-gold text-xs">호스트</span>
              )}
            </div>
          ))}

          {/* 빈 슬롯 */}
          {Array.from({ length: maxPlayers - playerCount }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="eb-window flex items-center gap-3 !border-dashed !border-slate-700 opacity-40"
            >
              <span className="font-body text-lg text-slate-600">○</span>
              <span className="font-body text-slate-600">대기 중...</span>
            </div>
          ))}
        </div>
      </div>

      {/* 캐릭터 패널 토글 */}
      {showCharPanel && (
        <div className="relative z-10">
          <CharacterPanel inventory={inventory} equipment={equipment} onClose={() => setShowCharPanel(false)} />
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex flex-col gap-3 relative z-10">
        <button
          onClick={() => setShowCharPanel(!showCharPanel)}
          className="w-full eb-window !border-arcane text-center active:scale-95 transition-transform"
        >
          <span className="font-title text-sm text-arcane-light">
            {showCharPanel ? '패널 닫기' : '캐릭터 정보'}
          </span>
        </button>
        {isHost && (
          <button
            onClick={onStartGame}
            className="w-full eb-window !border-gold text-center active:scale-95 transition-transform"
          >
            <span className="font-title text-base text-gold">{startButtonText}</span>
          </button>
        )}
        <button
          onClick={onLeaveRoom}
          className="w-full eb-window !border-tier-fail text-center active:scale-95 transition-transform"
        >
          <span className="font-title text-sm text-tier-fail">나가기</span>
        </button>
      </div>
    </div>
  );
}

function CharacterPanel({
  inventory,
  equipment,
  onClose,
}: {
  inventory: InventoryItemDisplay[];
  equipment: import('@round-midnight/shared').Equipment | null;
  onClose: () => void;
}) {
  if (inventory.length === 0 && !equipment) {
    return (
      <div className="eb-window animate-fade-in">
        <div className="font-title text-sm text-arcane-light mb-2">캐릭터 정보</div>
        <div className="font-body text-sm text-slate-500 text-center py-4">
          아직 모험을 떠나지 않았습니다
        </div>
      </div>
    );
  }

  const equippedItems = inventory.filter((i) => i.equipped);
  const unequippedItems = inventory.filter((i) => !i.equipped);

  return (
    <div className="eb-window animate-fade-in max-h-64 overflow-y-auto">
      <div className="font-title text-sm text-arcane-light mb-2">캐릭터 정보</div>

      {/* 장착 장비 */}
      {equippedItems.length > 0 && (
        <div className="mb-3">
          <div className="font-title text-xs text-slate-500 mb-1">장착 중</div>
          <div className="space-y-1">
            {equippedItems.map((item, i) => (
              <div key={`eq-${i}`} className="flex items-center gap-2 font-body text-xs">
                <span className="text-slate-500">[{TYPE_LABELS[item.type]}]</span>
                <span className={RARITY_COLORS[item.rarity]}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 미장착 아이템 */}
      {unequippedItems.length > 0 && (
        <div>
          <div className="font-title text-xs text-slate-500 mb-1">보관 중 ({unequippedItems.length})</div>
          <div className="space-y-1">
            {unequippedItems.map((item, i) => (
              <div key={`inv-${i}`} className="flex items-center gap-2 font-body text-xs">
                <span className="text-slate-600">[{TYPE_LABELS[item.type]}]</span>
                <span className={`${RARITY_COLORS[item.rarity]} opacity-70`}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
