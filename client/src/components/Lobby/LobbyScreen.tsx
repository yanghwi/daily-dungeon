import { useState, useEffect } from 'react';
import type { Room, Character, InventoryItemDisplay, ItemRarity, RoomMode } from '@round-midnight/shared';
import { GAME_CONSTANTS } from '@round-midnight/shared';
import { useGameStore } from '../../stores/gameStore';
import { apiRegister, apiLoginPin, apiGetRuns, apiGetDailyToday, getDiscordLoginUrl } from '../../hooks/useApi';
import LobbyBg from './LobbyBg';

type LobbyProps =
  | {
      mode: 'home';
      onCreateRoom: (name: string, roomMode?: RoomMode, dailySeedId?: string, seed?: string) => void;
      onJoinRoom: (code: string, name: string) => void;
      room?: never;
      player?: never;
      onStartGame?: never;
      onLeaveRoom?: never;
    }
  | {
      mode: 'room';
      room: Room;
      player: Character;
      onStartGame: () => void;
      onLeaveRoom: () => void;
      onCreateRoom?: never;
      onJoinRoom?: never;
    };

export default function LobbyScreen(props: LobbyProps) {
  if (props.mode === 'home') {
    return <HomeView onCreateRoom={props.onCreateRoom} onJoinRoom={props.onJoinRoom} />;
  }
  return (
    <RoomView
      room={props.room}
      player={props.player}
      onStartGame={props.onStartGame}
      onLeaveRoom={props.onLeaveRoom}
    />
  );
}

// ===== 홈 화면 =====

function HomeView({
  onCreateRoom,
  onJoinRoom,
}: {
  onCreateRoom: (name: string, roomMode?: RoomMode, dailySeedId?: string, seed?: string) => void;
  onJoinRoom: (code: string, name: string) => void;
}) {
  const authUser = useGameStore((s) => s.authUser);
  const setAuth = useGameStore((s) => s.setAuth);
  const runHistory = useGameStore((s) => s.runHistory);
  const setRunHistory = useGameStore((s) => s.setRunHistory);
  const clearAuth = useGameStore((s) => s.clearAuth);

  const [name, setName] = useState(authUser?.displayName ?? '');
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // 로그인 상태면 런 히스토리 로드
  useEffect(() => {
    if (authUser) {
      apiGetRuns(10).then((data) => setRunHistory(data.runs)).catch(() => {});
    }
  }, [authUser]);

  const handleRegister = async () => {
    if (!name.trim()) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const data = await apiRegister(name.trim());
      setAuth(data.token, data.user);
    } catch (err: any) {
      setAuthError(err.message || '등록 실패');
    }
    setAuthLoading(false);
  };

  const handlePinLogin = async () => {
    if (!pinInput.trim()) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const data = await apiLoginPin(pinInput.trim());
      setAuth(data.token, data.user);
      setName(data.user.displayName);
    } catch (err: any) {
      setAuthError(err.message || 'PIN 인증 실패');
    }
    setAuthLoading(false);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreateRoom(name.trim());
  };

  const handleDaily = async () => {
    if (!name.trim()) return;
    try {
      const daily = await apiGetDailyToday();
      onCreateRoom(name.trim(), 'daily', daily.seedId);
    } catch {
      // DB 없으면 일반 모드로 폴백
      onCreateRoom(name.trim());
    }
  };

  const handleJoin = () => {
    if (!name.trim() || !joinCode.trim()) return;
    onJoinRoom(joinCode.trim().toUpperCase(), name.trim());
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 relative min-h-dvh">
      <LobbyBg />

      {/* 타이틀 */}
      <div className="text-center relative z-10">
        <h1 className="font-title text-xl sm:text-2xl text-white tracking-wider lobby-title">
          Round Midnight
        </h1>
        <p className="mt-3 font-body text-sm text-gold tracking-widest lobby-subtitle">
          자정이 지나면, 이상한 일이 시작된다
        </p>
      </div>

      {/* 인증 영역 */}
      {authUser ? (
        <div className="w-full max-w-xs relative z-10">
          <div className="eb-window flex items-center justify-between">
            <div>
              <span className="font-body text-white text-sm">{authUser.displayName}</span>
              <span className="font-body text-slate-500 text-xs ml-2">PIN: {authUser.pin}</span>
            </div>
            <button onClick={clearAuth} className="font-body text-xs text-tier-fail active:opacity-70">
              로그아웃
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-xs relative z-10 flex flex-col gap-2">
          {showPin ? (
            <div className="eb-window flex flex-col gap-2">
              <input
                type="text"
                placeholder="6자리 PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                maxLength={6}
                className="w-full px-4 py-2 bg-transparent text-white placeholder-slate-500 text-center font-body text-lg focus:outline-none border-b border-slate-700"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowPin(false)} className="flex-1 font-body text-xs text-slate-400 py-1">
                  취소
                </button>
                <button
                  onClick={handlePinLogin}
                  disabled={pinInput.length < 6 || authLoading}
                  className="flex-1 font-body text-xs text-arcane-light py-1 disabled:opacity-40"
                >
                  {authLoading ? '...' : 'PIN 로그인'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <a
                href={getDiscordLoginUrl()}
                className="w-full eb-window !border-[#5865F2] text-center active:scale-95 transition-transform block"
              >
                <span className="font-title text-xs text-[#5865F2]">Discord 로그인</span>
              </a>
              <button
                onClick={() => setShowPin(true)}
                className="w-full font-body text-xs text-slate-400 py-1 active:opacity-70"
              >
                기존 PIN으로 로그인
              </button>
            </>
          )}
          {authError && <p className="font-body text-xs text-tier-fail text-center">{authError}</p>}
        </div>
      )}

      {/* 이름 입력 */}
      <div className="w-full max-w-xs relative z-10">
        <div className="eb-window !p-0">
          <input
            type="text"
            placeholder="이름을 입력하세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={10}
            className="w-full px-4 py-3 bg-transparent text-white placeholder-slate-500 text-center font-body text-lg focus:outline-none"
          />
        </div>
      </div>

      {/* 버튼들 */}
      <div className="w-full max-w-xs flex flex-col gap-3 relative z-10">
        {/* 데일리 던전 */}
        <button
          onClick={handleDaily}
          disabled={!name.trim()}
          className="w-full eb-window !border-gold text-center active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
        >
          <span className="font-title text-sm text-gold">오늘의 던전</span>
        </button>

        <button
          onClick={() => { handleCreate(); if (!authUser && name.trim()) handleRegister(); }}
          disabled={!name.trim()}
          className="w-full eb-window !border-arcane-light text-center active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
        >
          <span className="font-title text-sm text-arcane-light">방 만들기</span>
        </button>

        {!showJoin ? (
          <button
            onClick={() => setShowJoin(true)}
            className="w-full eb-window !border-slate-400 text-center active:scale-95 transition-transform"
          >
            <span className="font-title text-sm text-slate-300">참가하기</span>
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
              disabled={!name.trim() || joinCode.length < 4}
              className="eb-window !border-arcane-light active:scale-95 transition-transform disabled:opacity-40"
            >
              <span className="font-title text-sm text-arcane-light">입장</span>
            </button>
          </div>
        )}

        {/* 런 히스토리 */}
        {authUser && runHistory.length > 0 && (
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

      {/* 런 히스토리 패널 */}
      {showHistory && runHistory.length > 0 && (
        <div className="w-full max-w-xs relative z-10 eb-window max-h-48 overflow-y-auto animate-fade-in">
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
    </div>
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
            <span className="font-title text-base text-gold">게임 시작</span>
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
