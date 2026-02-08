import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { apiRegister, apiLoginPin, getDiscordLoginUrl } from '../../hooks/useApi';
import LobbyBg from '../Lobby/LobbyBg';

export default function LoginScreen() {
  const setAuth = useGameStore((s) => s.setAuth);

  const [showPin, setShowPin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePinLogin = async () => {
    if (!pinInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiLoginPin(pinInput.trim());
      setAuth(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'PIN 인증 실패');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!nameInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiRegister(nameInput.trim());
      setAuth(data.token, data.user);
    } catch (err: any) {
      setError(err.message || '등록 실패');
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 relative min-h-dvh">
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

      {/* 로그인 영역 */}
      <div className="w-full max-w-xs relative z-10 flex flex-col gap-3">
        {showPin ? (
          <div className="eb-window flex flex-col gap-3">
            <p className="font-title text-xs text-arcane-light text-center">PIN 로그인</p>
            <input
              type="text"
              placeholder="6자리 PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              maxLength={6}
              className="w-full px-4 py-3 bg-transparent text-white placeholder-slate-500 text-center font-body text-lg focus:outline-none border-b border-slate-700"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowPin(false); setError(''); }}
                className="flex-1 font-body text-sm text-slate-400 py-2 active:opacity-70"
              >
                돌아가기
              </button>
              <button
                onClick={handlePinLogin}
                disabled={pinInput.length < 6 || loading}
                className="flex-1 eb-window !border-arcane-light text-center active:scale-95 transition-transform disabled:opacity-40"
              >
                <span className="font-title text-xs text-arcane-light">
                  {loading ? '...' : '로그인'}
                </span>
              </button>
            </div>
          </div>
        ) : showRegister ? (
          <div className="eb-window flex flex-col gap-3">
            <p className="font-title text-xs text-arcane-light text-center">새 모험자 등록</p>
            <input
              type="text"
              placeholder="이름을 입력하세요"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={10}
              className="w-full px-4 py-3 bg-transparent text-white placeholder-slate-500 text-center font-body text-lg focus:outline-none border-b border-slate-700"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowRegister(false); setError(''); }}
                className="flex-1 font-body text-sm text-slate-400 py-2 active:opacity-70"
              >
                돌아가기
              </button>
              <button
                onClick={handleRegister}
                disabled={!nameInput.trim() || loading}
                className="flex-1 eb-window !border-gold text-center active:scale-95 transition-transform disabled:opacity-40"
              >
                <span className="font-title text-xs text-gold">
                  {loading ? '...' : '시작하기'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <a
              href={getDiscordLoginUrl()}
              className="w-full eb-window !border-[#5865F2] text-center active:scale-95 transition-transform block"
            >
              <span className="font-title text-sm text-[#5865F2]">Discord 로그인</span>
            </a>
            <button
              onClick={() => setShowPin(true)}
              className="w-full eb-window !border-slate-500 text-center active:scale-95 transition-transform"
            >
              <span className="font-title text-sm text-slate-300">PIN 로그인</span>
            </button>
            <button
              onClick={() => setShowRegister(true)}
              className="w-full eb-window !border-arcane text-center active:scale-95 transition-transform"
            >
              <span className="font-title text-sm text-arcane-light">새 모험자 등록</span>
            </button>
          </>
        )}

        {error && (
          <p className="font-body text-xs text-tier-fail text-center animate-fade-in">{error}</p>
        )}
      </div>
    </div>
  );
}
