import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { useGameStore } from './stores/gameStore';
import LoginScreen from './components/Hub/LoginScreen';
import CharacterHub from './components/Hub/CharacterHub';
import LobbyScreen from './components/Lobby/LobbyScreen';
import BattleScreen from './components/Battle/BattleScreen';
import RunResult from './components/Battle/RunResult';
import RoomCodeBadge from './components/RoomCodeBadge';

const BATTLE_PHASES = new Set(['wave_intro', 'choosing', 'rolling', 'narrating', 'wave_result', 'maintenance']);

function App() {
  const {
    createRoom, joinRoom, startGame, leaveRoom,
    submitChoice, rollDice, voteContinueOrRetreat,
    equipItem, unequipItem, useConsumable, discardItem,
  } = useSocket();
  const { phase, room, player, connected, error, setError, resetGame, authUser } = useGameStore();

  // 연결 바: 1.5초 이상 연결 안 되면 표시
  const [showConnectionBar, setShowConnectionBar] = useState(false);
  useEffect(() => {
    if (!connected) {
      const timer = setTimeout(() => setShowConnectionBar(true), 1500);
      return () => clearTimeout(timer);
    }
    setShowConnectionBar(false);
  }, [connected]);

  // 에러 토스트 자동 제거
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  return (
    <div className="min-h-dvh bg-midnight-900 flex flex-col">
      {/* 연결 상태 — 1.5초 이상 끊길 때만 표시 */}
      {showConnectionBar && !connected && (
        <div className="fixed left-0 right-0 p-2.5 bg-arcane text-white text-center text-sm font-bold z-50"
             style={{ top: 'env(safe-area-inset-top, 0px)' }}>
          연결 중...
        </div>
      )}

      {/* 에러 토스트 */}
      {error && (
        <div className="fixed left-1/2 -translate-x-1/2 px-6 py-3.5 bg-red-500 text-white border-2 border-red-400 rounded text-sm z-50 animate-fade-in"
             style={{ top: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>
          {error}
        </div>
      )}

      {/* 방 코드 배지 — 로비 이후 모든 화면에서 표시 */}
      {room && phase !== 'waiting' && <RoomCodeBadge />}

      {/* 메인 콘텐츠 */}
      {!authUser && phase === 'waiting' && (
        <LoginScreen />
      )}

      {authUser && !room && phase === 'waiting' && (
        <CharacterHub
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
        />
      )}

      {authUser && room && phase === 'waiting' && player && (
        <LobbyScreen
          mode="room"
          room={room}
          player={player}
          onStartGame={startGame}
          onLeaveRoom={leaveRoom}
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
