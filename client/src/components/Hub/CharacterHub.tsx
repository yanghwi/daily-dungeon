import { useState, useEffect } from 'react';
import type { RoomMode } from '@round-midnight/shared';
import { useGameStore } from '../../stores/gameStore';
import { BACKGROUNDS } from '../../styles/theme';
import { apiGetRuns, apiGetDailyToday, apiGetProfile } from '../../hooks/useApi';
import LobbyBg from '../Lobby/LobbyBg';
import UnlockPanel from './UnlockPanel';

interface CharacterHubProps {
  onCreateRoom: (name: string, roomMode?: RoomMode, dailySeedId?: string, seed?: string) => void;
  onJoinRoom: (code: string, name: string) => void;
}

export default function CharacterHub({ onCreateRoom, onJoinRoom }: CharacterHubProps) {
  const authUser = useGameStore((s) => s.authUser);
  const clearAuth = useGameStore((s) => s.clearAuth);
  const setPendingAction = useGameStore((s) => s.setPendingAction);
  const runHistory = useGameStore((s) => s.runHistory);
  const setRunHistory = useGameStore((s) => s.setRunHistory);

  const [activePanel, setActivePanel] = useState<'none' | 'stats' | 'guide' | 'unlock'>('none');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [starting, setStarting] = useState(false);

  const setAuth = useGameStore((s) => s.setAuth);
  const authToken = useGameStore((s) => s.authToken);

  // 런 히스토리 + 프로필(레벨) 로드
  useEffect(() => {
    if (authUser && authToken) {
      apiGetRuns(10).then((data) => setRunHistory(data.runs)).catch((err) => {
        console.warn('[CharacterHub] Failed to load runs:', err.message);
      });
      apiGetProfile().then((data: any) => {
        if (data.level) {
          setAuth(authToken, {
            ...authUser,
            level: data.level.level,
            xp: data.level.xp,
            xpToNext: data.level.xpToNext,
            totalRuns: data.stats?.totalRuns ?? 0,
          });
        }
      }).catch((err) => {
        console.warn('[CharacterHub] Failed to load profile:', err.message);
      });
    }
  }, [authUser?.id]);

  // PIN으로 고정 배경 찾기
  const currentBg = BACKGROUNDS.find((b) => {
    const pinBgMap: Record<string, string> = {
      '910531': '데이터 분석가',
      '910530': '마케팅 기획자',
      '911125': '스타트업 대표',
      '910403': '기자',
    };
    return b.label === pinBgMap[authUser?.pin ?? ''];
  }) ?? BACKGROUNDS[0];

  // 게임 시작 (데일리 시드 → 방 생성 → 자동 시작)
  const handleStartGame = async () => {
    if (!authUser) return;
    setStarting(true);
    setPendingAction('solo_start');
    try {
      const daily = await apiGetDailyToday();
      onCreateRoom(authUser.displayName, 'daily', daily.seedId);
    } catch {
      onCreateRoom(authUser.displayName);
    }
  };

  // 방 참가
  const handleJoin = () => {
    if (!authUser || !joinCode.trim()) return;
    onJoinRoom(joinCode.trim().toUpperCase(), authUser.displayName);
  };

  if (!authUser) return null;

  return (
    <div className="flex-1 flex flex-col px-6 py-5 gap-4 relative h-dvh overflow-y-auto">
      <LobbyBg />

      {/* 상단 바 */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <span className="font-body text-white text-sm">{authUser.displayName}</span>
          {authUser.level != null && (
            <span className="font-body text-arcane-light text-xs">Lv.{authUser.level}</span>
          )}
        </div>
        <button onClick={clearAuth} className="font-body text-xs text-tier-fail active:opacity-70">
          로그아웃
        </button>
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

      {/* 캐릭터 영역 (읽기전용) */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 relative z-10">
        <div className="text-center">
          <span className="text-4xl">{currentBg.emoji}</span>
          <p className="font-body text-white text-lg font-bold mt-2">{authUser.displayName}</p>
          <p className="font-body text-arcane-light text-sm">{currentBg.label}</p>
          <div className="flex flex-col gap-0.5 mt-1">
            <p className="font-body text-slate-400 text-xs">특성: {currentBg.trait}</p>
            <p className="font-body text-slate-400 text-xs">약점: {currentBg.weakness}</p>
            <p className="font-body text-slate-500 text-xs">{currentBg.description}</p>
          </div>
        </div>
      </div>

      {/* 패널 영역 */}
      {activePanel === 'stats' && (
        <div className="relative z-10 animate-fade-in">
          <StatsPanel
            authUser={authUser}
            totalRuns={authUser.totalRuns ?? 0}
            onClose={() => setActivePanel('none')}
          />
        </div>
      )}

      {activePanel === 'guide' && (
        <div className="relative z-10 animate-fade-in">
          <GuidePanel onClose={() => setActivePanel('none')} />
        </div>
      )}

      {activePanel === 'unlock' && (
        <div className="relative z-10 animate-fade-in">
          <UnlockPanel onClose={() => setActivePanel('none')} />
        </div>
      )}

      {/* 네비게이션 버튼 */}
      {activePanel === 'none' && (
        <>
          <div className="flex gap-2 relative z-10">
            <button
              onClick={() => setActivePanel('stats')}
              className="flex-1 eb-window !border-slate-500 text-center active:scale-95 transition-transform"
            >
              <span className="font-title text-xs text-slate-300">통계</span>
            </button>
            <button
              onClick={() => setActivePanel('unlock')}
              className="flex-1 eb-window !border-gold/50 text-center active:scale-95 transition-transform"
            >
              <span className="font-title text-xs text-gold">도전</span>
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
                    <span className={run.result === 'clear' ? 'text-gold' : 'text-tier-fail'}>
                      {run.result === 'clear' ? 'CLEAR' : 'WIPE'}
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

// ─── 통계 패널 ───

function StatsPanel({
  authUser,
  totalRuns,
  onClose,
}: {
  authUser: { level?: number; xp?: number; xpToNext?: number };
  totalRuns: number;
  onClose: () => void;
}) {
  return (
    <div className="eb-window">
      <div className="flex items-center justify-between mb-3">
        <span className="font-title text-sm text-arcane-light">통계</span>
        <button onClick={onClose} className="px-3 py-1.5 rounded border border-slate-500 font-body text-xs text-slate-200 active:bg-slate-700 transition-colors">✕ 닫기</button>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between font-body text-sm">
          <span className="text-slate-400">레벨</span>
          <span className="text-white">{authUser.level ?? 1}</span>
        </div>
        <div className="flex justify-between font-body text-sm">
          <span className="text-slate-400">XP</span>
          <span className="text-arcane-light">{authUser.xp ?? 0} / {authUser.xpToNext ?? 50}</span>
        </div>
        <div className="flex justify-between font-body text-sm">
          <span className="text-slate-400">총 런 수</span>
          <span className="text-white">{totalRuns}</span>
        </div>
      </div>
    </div>
  );
}

// ─── 안내 패널 ───

function GuidePanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="eb-window">
      <div className="flex items-center justify-between mb-3">
        <span className="font-title text-sm text-arcane-light">안내</span>
        <button onClick={onClose} className="px-3 py-1.5 rounded border border-slate-500 font-body text-xs text-slate-200 active:bg-slate-700 transition-colors">✕ 닫기</button>
      </div>
      <div className="space-y-2 font-body text-sm text-slate-300 leading-relaxed">
        <p>던전에서 적을 처치하면 전리품을 획득합니다.</p>
        <p>장비는 정비 시간에 장착/해제할 수 있습니다.</p>
        <p className="text-slate-500 text-xs">
          * 로그라이트: 매 런마다 장비가 리셋됩니다.
        </p>
      </div>
    </div>
  );
}
