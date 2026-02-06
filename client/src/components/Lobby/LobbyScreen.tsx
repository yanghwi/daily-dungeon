import { useState } from 'react';
import type { Room, Character } from '@round-midnight/shared';
import { GAME_CONSTANTS } from '@round-midnight/shared';

type LobbyProps =
  | {
      mode: 'home';
      onCreateRoom: (name: string) => void;
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
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
}) {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreateRoom(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || !joinCode.trim()) return;
    onJoinRoom(joinCode.trim().toUpperCase(), name.trim());
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
      {/* 타이틀 */}
      <div className="text-center">
        <h1 className="font-title text-xl sm:text-2xl text-white tracking-tight">
          Round Midnight
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          자정이 지나면, 이상한 일이 시작된다
        </p>
      </div>

      {/* 이름 입력 */}
      <div className="w-full max-w-xs">
        <input
          type="text"
          placeholder="이름을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={10}
          className="w-full px-4 py-3 bg-midnight-700 border-2 border-indigo rounded text-white placeholder-slate-500 text-center text-lg focus:outline-none focus:border-arcane-light transition-colors"
        />
      </div>

      {/* 버튼들 */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full py-3.5 bg-arcane text-white font-bold rounded border-2 border-arcane-light active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
        >
          방 만들기
        </button>

        {!showJoin ? (
          <button
            onClick={() => setShowJoin(true)}
            className="w-full py-3.5 bg-transparent text-arcane-light font-bold rounded border-2 border-arcane-light/50 active:scale-95 transition-transform"
          >
            참가하기
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="방 코드"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={4}
              className="flex-1 px-3 py-3 bg-midnight-700 border-2 border-indigo rounded text-white placeholder-slate-500 text-center text-lg tracking-widest focus:outline-none focus:border-arcane-light transition-colors"
            />
            <button
              onClick={handleJoin}
              disabled={!name.trim() || joinCode.length < 4}
              className="px-5 py-3 bg-arcane text-white font-bold rounded border-2 border-arcane-light active:scale-95 transition-transform disabled:opacity-40"
            >
              입장
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 대기실 화면 =====

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

  return (
    <div className="flex-1 flex flex-col px-6 py-8 gap-6">
      {/* 방 코드 */}
      <div className="text-center">
        <p className="text-slate-400 text-sm mb-1">방 코드</p>
        <p className="font-title text-2xl sm:text-3xl text-gold tracking-[0.2em] sm:tracking-[0.3em]">
          {room.code}
        </p>
        <p className="text-slate-500 text-xs mt-1">친구에게 이 코드를 알려주세요</p>
      </div>

      {/* 참가자 목록 */}
      <div className="flex-1">
        <p className="text-slate-400 text-sm mb-3">
          참가자 ({playerCount}/{maxPlayers})
        </p>
        <div className="flex flex-col gap-2">
          {room.players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-4 py-3 rounded border-2 ${
                p.id === player.id
                  ? 'bg-arcane/20 border-arcane'
                  : 'bg-midnight-700 border-midnight-700'
              }`}
            >
              <span className="text-lg">
                {p.id === room.hostId ? '👑' : '🎮'}
              </span>
              <span className="text-white font-medium flex-1">
                {p.name}
                {p.id === player.id && (
                  <span className="text-arcane-light text-xs ml-2">(나)</span>
                )}
              </span>
              {p.id === room.hostId && (
                <span className="text-gold text-xs">호스트</span>
              )}
            </div>
          ))}

          {/* 빈 슬롯 */}
          {Array.from({ length: maxPlayers - playerCount }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 px-4 py-3 rounded border-2 border-dashed border-midnight-600 text-slate-600"
            >
              <span className="text-lg">⬜</span>
              <span>대기 중...</span>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex flex-col gap-3">
        {isHost && (
          <button
            onClick={onStartGame}
            className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded border-2 border-green-400 active:scale-95 transition-transform"
          >
            게임 시작
          </button>
        )}
        <button
          onClick={onLeaveRoom}
          className="w-full py-3 bg-transparent text-red-400 font-medium rounded border-2 border-red-400/30 active:scale-95 transition-transform"
        >
          나가기
        </button>
      </div>
    </div>
  );
}
