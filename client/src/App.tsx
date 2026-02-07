import { useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { useGameStore } from './stores/gameStore';
import LobbyScreen from './components/Lobby/LobbyScreen';
import CharacterSetup from './components/Lobby/CharacterSetup';
import BattleScreen from './components/Battle/BattleScreen';
import RunResult from './components/Battle/RunResult';

const BATTLE_PHASES = new Set(['wave_intro', 'choosing', 'rolling', 'narrating', 'wave_result', 'maintenance']);

function App() {
  const {
    createRoom, joinRoom, startGame, leaveRoom,
    submitCharacterSetup, submitChoice, rollDice, voteContinueOrRetreat,
    equipItem, unequipItem, useConsumable, discardItem,
  } = useSocket();
  const { phase, room, player, connected, error, setError, resetGame } = useGameStore();
  const setAuth = useGameStore((s) => s.setAuth);

  // Discord OAuth 콜백 처리 (URL에서 토큰 파싱)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userJson = params.get('user');
    if (token && userJson) {
      try {
        const user = JSON.parse(decodeURIComponent(userJson));
        setAuth(token, user);
      } catch { /* ignore parse error */ }
      // URL 정리
      window.history.replaceState({}, '', window.location.pathname);
    }
    const authError = params.get('auth_error');
    if (authError) {
      setError(`Discord 로그인 실패: ${authError}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // 에러 토스트 자동 제거
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const isInLobby = room !== null && phase === 'waiting';

  return (
    <div className="min-h-dvh bg-midnight-900 flex flex-col">
      {/* 연결 상태 */}
      {!connected && (
        <div className="fixed top-0 left-0 right-0 p-2.5 bg-arcane text-white text-center text-sm font-bold z-50">
          연결 중...
        </div>
      )}

      {/* 에러 토스트 */}
      {error && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3.5 bg-red-500 text-white border-2 border-red-400 rounded text-sm z-50 animate-fade-in">
          {error}
        </div>
      )}

      {/* 메인 콘텐츠 */}
      {!room && phase === 'waiting' && (
        <LobbyScreen
          mode="home"
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
        />
      )}

      {isInLobby && player && (
        <LobbyScreen
          mode="room"
          room={room}
          player={player}
          onStartGame={startGame}
          onLeaveRoom={leaveRoom}
        />
      )}

      {phase === 'character_setup' && room && player && (
        <CharacterSetup
          room={room}
          player={player}
          onSubmit={submitCharacterSetup}
        />
      )}

      {BATTLE_PHASES.has(phase) && (
        <BattleScreen
          onSubmitChoice={submitChoice}
          onRoll={rollDice}
          onVote={voteContinueOrRetreat}
          onEquipItem={equipItem}
          onUnequipItem={unequipItem}
          onUseConsumable={useConsumable}
          onDiscardItem={discardItem}
        />
      )}

      {phase === 'run_end' && (
        <RunResult onReturnToLobby={resetGame} />
      )}
    </div>
  );
}

export default App;
