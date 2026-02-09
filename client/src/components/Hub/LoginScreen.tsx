import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { apiLoginPin } from '../../hooks/useApi';
import LobbyBg from '../Lobby/LobbyBg';

export default function LoginScreen() {
  const setAuth = useGameStore((s) => s.setAuth);

  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePinLogin = async () => {
    if (pinInput.length < 6) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiLoginPin(pinInput.trim());
      setAuth(data.token, data.user);
    } catch (err: any) {
      setError('등록되지 않은 생일입니다');
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

      {/* PIN 로그인 */}
      <div className="w-full max-w-xs relative z-10 flex flex-col gap-3">
        <div className="eb-window flex flex-col gap-3">
          <p className="font-title text-xs text-arcane-light text-center">생일로 로그인</p>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="생일 6자리 (YYMMDD)"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            className="w-full px-4 py-3 bg-transparent text-white placeholder-slate-500 text-center font-body text-lg focus:outline-none border-b border-slate-700"
            onKeyDown={(e) => e.key === 'Enter' && handlePinLogin()}
          />
          <button
            onClick={handlePinLogin}
            disabled={pinInput.length < 6 || loading}
            className="w-full eb-window !border-arcane-light text-center active:scale-95 transition-transform disabled:opacity-40"
          >
            <span className="font-title text-xs text-arcane-light">
              {loading ? '...' : '입장'}
            </span>
          </button>
        </div>

        {error && (
          <p className="font-body text-xs text-tier-fail text-center animate-fade-in">{error}</p>
        )}
      </div>
    </div>
  );
}
