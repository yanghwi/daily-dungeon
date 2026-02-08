import { useState, useEffect } from 'react';
import type { RoomMode, InventoryItemDisplay, ItemRarity } from '@round-midnight/shared';
import { useGameStore } from '../../stores/gameStore';
import type { CharacterConfig } from '../../stores/gameStore';
import { BACKGROUNDS } from '../../styles/theme';
import {
  buildCharacterSprite,
  DEFAULT_APPEARANCE,
  type CharacterAppearance,
} from '../../assets/sprites/characterParts';
import { apiGetRuns, apiGetDailyToday, apiGetProfile } from '../../hooks/useApi';
import LobbyBg from '../Lobby/LobbyBg';
import CharacterCreator from '../Lobby/CharacterCreator';

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

interface CharacterHubProps {
  onCreateRoom: (name: string, roomMode?: RoomMode, dailySeedId?: string, seed?: string) => void;
  onJoinRoom: (code: string, name: string) => void;
}

export default function CharacterHub({ onCreateRoom, onJoinRoom }: CharacterHubProps) {
  const authUser = useGameStore((s) => s.authUser);
  const clearAuth = useGameStore((s) => s.clearAuth);
  const characterConfig = useGameStore((s) => s.characterConfig);
  const setCharacterConfig = useGameStore((s) => s.setCharacterConfig);
  const setPendingAction = useGameStore((s) => s.setPendingAction);
  const runHistory = useGameStore((s) => s.runHistory);
  const setRunHistory = useGameStore((s) => s.setRunHistory);
  const inventory = useGameStore((s) => s.inventory);
  const equipment = useGameStore((s) => s.equipment);

  const [activePanel, setActivePanel] = useState<'none' | 'appearance' | 'equipment' | 'inventory' | 'background'>('none');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [starting, setStarting] = useState(false);

  // 캐릭터 설정 초기화 (없으면 기본값)
  useEffect(() => {
    if (!characterConfig && authUser) {
      setCharacterConfig({
        name: authUser.displayName,
        background: BACKGROUNDS[0].label,
        appearance: DEFAULT_APPEARANCE,
      });
    }
  }, [authUser]);

  const setAuth = useGameStore((s) => s.setAuth);
  const authToken = useGameStore((s) => s.authToken);

  // 런 히스토리 + 프로필(레벨) 로드
  useEffect(() => {
    if (authUser) {
      apiGetRuns(10).then((data) => setRunHistory(data.runs)).catch(() => {});
      // 레벨 정보 로드
      if (authToken) {
        apiGetProfile().then((data: any) => {
          if (data.level) {
            setAuth(authToken, {
              ...authUser,
              level: data.level.level,
              xp: data.level.xp,
              xpToNext: data.level.xpToNext,
              totalRuns: data.stats?.totalRuns,
            });
          }
        }).catch(() => {});
      }
    }
  }, [authUser?.id]);

  const currentBg = BACKGROUNDS.find((b) => b.label === characterConfig?.background) ?? BACKGROUNDS[0];
  const appearance = characterConfig?.appearance ?? DEFAULT_APPEARANCE;
  const sprite = buildCharacterSprite(appearance);

  // 게임 시작 (데일리 시드 → 방 생성 → 자동 시작, 실패 시 일반 모드 폴백)
  const handleStartGame = async () => {
    if (!characterConfig) return;
    setStarting(true);
    setPendingAction('solo_start');
    try {
      const daily = await apiGetDailyToday();
      onCreateRoom(characterConfig.name, 'daily', daily.seedId);
    } catch {
      onCreateRoom(characterConfig.name);
    }
  };

  // 방 참가
  const handleJoin = () => {
    if (!characterConfig || !joinCode.trim()) return;
    onJoinRoom(joinCode.trim().toUpperCase(), characterConfig.name);
  };

  // 배경 변경
  const handleSelectBackground = (bgLabel: string) => {
    if (!characterConfig) return;
    setCharacterConfig({ ...characterConfig, background: bgLabel });
    setActivePanel('none');
  };

  // 외형 변경
  const handleAppearanceConfirm = (app: CharacterAppearance) => {
    if (!characterConfig) return;
    setCharacterConfig({ ...characterConfig, appearance: app });
    setActivePanel('none');
  };

  if (!authUser || !characterConfig) return null;

  return (
    <div className="flex-1 flex flex-col px-6 py-5 gap-4 relative min-h-dvh">
      <LobbyBg />

      {/* 상단 바 */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <span className="font-body text-white text-sm">{authUser.displayName}</span>
          {authUser.level != null && (
            <span className="font-body text-arcane-light text-xs">Lv.{authUser.level}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-body text-slate-500 text-xs">PIN: {authUser.pin}</span>
          <button onClick={clearAuth} className="font-body text-xs text-tier-fail active:opacity-70">
            로그아웃
          </button>
        </div>
      </div>

      {/* XP 바 */}
      {authUser.level != null && authUser.xp != null && authUser.xpToNext != null && (
        <div className="relative z-10">
          <div className="w-full h-2 bg-midnight-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-arcane transition-all"
              style={{ width: `${Math.min((authUser.xp / authUser.xpToNext) * 100, 100)}%` }}
            />
          </div>
          <p className="font-body text-[10px] text-slate-500 text-right mt-0.5">
            {authUser.xp}/{authUser.xpToNext} XP
          </p>
        </div>
      )}

      {/* 캐릭터 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 relative z-10">
        {/* 스프라이트 */}
        <div className="relative" style={{ width: 120, height: 180 }}>
          <div
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              boxShadow: sprite,
              transform: 'scale(4)',
              transformOrigin: 'top left',
              left: 24,
              top: 16,
            }}
          />
        </div>

        {/* 캐릭터 정보 */}
        <div className="text-center">
          <p className="font-body text-white text-lg font-bold">{characterConfig.name}</p>
          <p className="font-body text-arcane-light text-sm">{currentBg.label}</p>
          <div className="flex flex-col gap-0.5 mt-1">
            <p className="font-body text-slate-400 text-xs">특성: {currentBg.trait}</p>
            <p className="font-body text-slate-400 text-xs">약점: {currentBg.weakness}</p>
            <p className="font-body text-slate-500 text-xs">{currentBg.description}</p>
          </div>
        </div>
      </div>

      {/* 패널 영역 */}
      {activePanel === 'appearance' && (
        <div className="relative z-10 animate-fade-in">
          <CharacterCreator
            initialAppearance={appearance}
            onConfirm={handleAppearanceConfirm}
            onCancel={() => setActivePanel('none')}
          />
        </div>
      )}

      {activePanel === 'background' && (
        <div className="relative z-10 animate-fade-in">
          <div className="eb-window">
            <div className="flex items-center justify-between mb-3">
              <span className="font-title text-sm text-arcane-light">배경 선택</span>
              <button onClick={() => setActivePanel('none')} className="font-body text-xs text-slate-400">닫기</button>
            </div>
            <div className="flex flex-col gap-2">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => handleSelectBackground(bg.label)}
                  className={`w-full text-left eb-window active:scale-[0.98] transition-all ${
                    characterConfig.background === bg.label
                      ? '!border-arcane-light'
                      : '!border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{bg.emoji}</span>
                    <div className="flex-1">
                      <p className="font-body text-white text-sm font-bold">{bg.label}</p>
                      <p className="font-body text-slate-400 text-xs">{bg.description}</p>
                    </div>
                    {characterConfig.background === bg.label && (
                      <span className="text-arcane-light font-body">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activePanel === 'equipment' && (
        <div className="relative z-10 animate-fade-in">
          <EquipmentPanel
            inventory={inventory}
            onClose={() => setActivePanel('none')}
          />
        </div>
      )}

      {activePanel === 'inventory' && (
        <div className="relative z-10 animate-fade-in">
          <InventoryPanel
            inventory={inventory}
            onClose={() => setActivePanel('none')}
          />
        </div>
      )}

      {/* 네비게이션 버튼 */}
      {activePanel === 'none' && (
        <>
          <div className="flex gap-2 relative z-10">
            <button
              onClick={() => setActivePanel('appearance')}
              className="flex-1 eb-window !border-slate-500 text-center active:scale-95 transition-transform"
            >
              <span className="font-title text-xs text-slate-300">외형</span>
            </button>
            <button
              onClick={() => setActivePanel('background')}
              className="flex-1 eb-window !border-slate-500 text-center active:scale-95 transition-transform"
            >
              <span className="font-title text-xs text-slate-300">배경</span>
            </button>
            <button
              onClick={() => setActivePanel('equipment')}
              className="flex-1 eb-window !border-slate-500 text-center active:scale-95 transition-transform"
            >
              <span className="font-title text-xs text-slate-300">장비</span>
            </button>
            <button
              onClick={() => setActivePanel('inventory')}
              className="flex-1 eb-window !border-slate-500 text-center active:scale-95 transition-transform"
            >
              <span className="font-title text-xs text-slate-300">인벤토리</span>
            </button>
          </div>

          {/* 메인 액션 */}
          <div className="flex flex-col gap-2 relative z-10">
            <button
              onClick={handleStartGame}
              disabled={starting}
              className="w-full eb-window !border-gold text-center active:scale-95 transition-transform disabled:opacity-60"
            >
              <span className="font-title text-base text-gold">
                {starting ? '준비 중...' : '게임 시작'}
              </span>
            </button>

            {!showJoinInput ? (
              <button
                onClick={() => setShowJoinInput(true)}
                className="w-full eb-window !border-arcane-light text-center active:scale-95 transition-transform"
              >
                <span className="font-title text-sm text-arcane-light">방 참가</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 eb-window !p-0">
                  <input
                    type="text"
                    placeholder="방 코드"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={4}
                    className="w-full px-3 py-3 bg-transparent text-white placeholder-slate-500 text-center font-body text-lg tracking-widest focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleJoin}
                  disabled={joinCode.length < 4}
                  className="eb-window !border-arcane-light active:scale-95 transition-transform disabled:opacity-40"
                >
                  <span className="font-title text-sm text-arcane-light">입장</span>
                </button>
              </div>
            )}

            {/* 런 히스토리 */}
            {runHistory.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full eb-window !border-slate-600 text-center active:scale-95 transition-transform"
              >
                <span className="font-title text-xs text-slate-400">
                  {showHistory ? '히스토리 닫기' : `런 히스토리 (${runHistory.length})`}
                </span>
              </button>
            )}
          </div>

          {/* 히스토리 패널 */}
          {showHistory && runHistory.length > 0 && (
            <div className="relative z-10 eb-window max-h-48 overflow-y-auto animate-fade-in">
              <div className="space-y-2">
                {runHistory.map((run, i) => (
                  <div key={i} className="flex items-center justify-between font-body text-xs">
                    <span className={
                      run.result === 'clear' ? 'text-gold' :
                      run.result === 'retreat' ? 'text-slate-400' : 'text-tier-fail'
                    }>
                      {run.result === 'clear' ? 'CLEAR' : run.result === 'retreat' ? 'RETREAT' : 'WIPE'}
                    </span>
                    <span className="text-slate-500">W{run.wavesCleared}/{run.totalWaves}</span>
                    <span className="text-slate-600">{run.characterName}</span>
                    {run.isDaily && <span className="text-gold text-[10px]">DAILY</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── 장비 패널 ───

function EquipmentPanel({
  inventory,
  onClose,
}: {
  inventory: InventoryItemDisplay[];
  onClose: () => void;
}) {
  const equippedItems = inventory.filter((i) => i.equipped);

  return (
    <div className="eb-window">
      <div className="flex items-center justify-between mb-2">
        <span className="font-title text-sm text-arcane-light">장착 장비</span>
        <button onClick={onClose} className="font-body text-xs text-slate-400">닫기</button>
      </div>
      {equippedItems.length === 0 ? (
        <p className="font-body text-sm text-slate-500 text-center py-4">
          장착된 장비가 없습니다. 던전에서 전리품을 획득하세요!
        </p>
      ) : (
        <div className="space-y-1">
          {equippedItems.map((item, i) => (
            <div key={`eq-${i}`} className="flex items-center gap-2 font-body text-xs">
              <span className="text-slate-500">[{TYPE_LABELS[item.type]}]</span>
              <span className={RARITY_COLORS[item.rarity]}>{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 인벤토리 패널 ───

function InventoryPanel({
  inventory,
  onClose,
}: {
  inventory: InventoryItemDisplay[];
  onClose: () => void;
}) {
  const unequippedItems = inventory.filter((i) => !i.equipped);

  return (
    <div className="eb-window">
      <div className="flex items-center justify-between mb-2">
        <span className="font-title text-sm text-arcane-light">인벤토리</span>
        <button onClick={onClose} className="font-body text-xs text-slate-400">닫기</button>
      </div>
      {unequippedItems.length === 0 ? (
        <p className="font-body text-sm text-slate-500 text-center py-4">
          인벤토리가 비어 있습니다. 던전에서 아이템을 발견하세요!
        </p>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {unequippedItems.map((item, i) => (
            <div key={`inv-${i}`} className="flex items-center gap-2 font-body text-xs">
              <span className="text-slate-600">[{TYPE_LABELS[item.type]}]</span>
              <span className={`${RARITY_COLORS[item.rarity]} opacity-70`}>{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
