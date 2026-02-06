import { useState } from 'react';
import type { Room, Character } from '@round-midnight/shared';
import { BACKGROUNDS } from '../../styles/theme';

interface CharacterSetupProps {
  room: Room;
  player: Character;
  onSubmit: (name: string, background: string) => void;
}

export default function CharacterSetup({ room, player, onSubmit }: CharacterSetupProps) {
  const [name, setName] = useState(player.name);
  const [selectedBg, setSelectedBg] = useState<string | null>(null);
  const hasSubmitted = player.background !== '';

  // 다른 플레이어가 이미 선택한 배경
  const takenBackgrounds = room.players
    .filter((p) => p.id !== player.id && p.background !== '')
    .map((p) => p.background);

  const handleSubmit = () => {
    if (!name.trim() || !selectedBg) return;
    onSubmit(name.trim(), selectedBg);
  };

  function getBackgroundFlavorText(backgroundLabel: string): string {
    const flavors: Record<string, string> = {
      '전직 경비원': '3년간의 야간 근무가 남긴 건 어둠에 대한 공포와, 수상한 것을 배트로 때려도 된다는 확신뿐이었다.',
      '요리사': '칼을 다루는 솜씨는 일품이지만, 주방에서 거미를 발견한 날은 영업을 쉬었다. 그런 날이 꽤 많았다.',
      '개발자': '버그를 고치는 데는 자신 있지만, 사람 앞에 서면 자기 이름도 버그처럼 더듬거린다. 보조배터리만은 항상 풀충전.',
      '영업사원': '세 치 혀로 안 되는 일이 없었다. 체력이 바닥나기 전까지는. 명함은 던지면 의외로 아프다.',
    };
    return flavors[backgroundLabel] ?? '';
  }

  // 준비 완료 상태
  const readyPlayers = room.players.filter((p) => p.background !== '');

  return (
    <div className="flex-1 flex flex-col px-6 py-6 gap-5">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="font-title text-sm sm:text-base text-white">캐릭터 설정</h2>
        <p className="text-slate-400 text-sm mt-1">
          당신은 누구입니까?
        </p>
      </div>

      {/* 이름 수정 */}
      {!hasSubmitted && (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={10}
          placeholder="이름"
          className="w-full px-4 py-3 bg-midnight-700 border-2 border-indigo rounded text-white text-center text-lg focus:outline-none focus:border-arcane-light transition-colors"
        />
      )}

      {/* 배경 선택 카드 */}
      {!hasSubmitted ? (
        <div className="flex-1 flex flex-col gap-3">
          <p className="text-slate-400 text-sm">배경을 선택하세요</p>
          {BACKGROUNDS.map((bg) => {
            const isTaken = takenBackgrounds.includes(bg.label);
            const isSelected = selectedBg === bg.label;

            return (
              <button
                key={bg.id}
                onClick={() => !isTaken && setSelectedBg(bg.label)}
                disabled={isTaken}
                className={`w-full text-left px-4 py-4 rounded border-2 transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-arcane/20 border-arcane shadow-lg shadow-arcane/20'
                    : isTaken
                      ? 'bg-midnight-800 border-midnight-700 opacity-40'
                      : 'bg-midnight-700 border-midnight-600 hover:border-arcane-light/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{bg.emoji}</span>
                  <div className="flex-1">
                    <p className="text-white font-bold">
                      {bg.label}
                      {isTaken && <span className="text-slate-500 text-xs ml-2">(선택됨)</span>}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">{bg.description}</p>
                    {isSelected && (
                      <p className="text-arcane-light text-xs mt-1 italic">
                        {getBackgroundFlavorText(bg.label)}
                      </p>
                    )}
                  </div>
                  {isSelected && <span className="text-arcane-light text-xl">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* 선택 완료 - 대기 화면 */
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-5xl mb-3">
              {BACKGROUNDS.find((b) => b.label === player.background)?.emoji ?? '🎮'}
            </p>
            <p className="text-white text-xl font-bold">{player.name}</p>
            <p className="text-arcane-light">{player.background}</p>
            <p className="text-slate-400 text-sm mt-1">특성: {player.trait}</p>
            <p className="text-slate-400 text-sm">약점: {player.weakness}</p>
          </div>
          <p className="text-slate-500 text-sm animate-pulse">
            다른 플레이어를 기다리는 중...
          </p>
        </div>
      )}

      {/* 준비 현황 */}
      <div className="flex gap-2 justify-center">
        {room.players.map((p) => (
          <div
            key={p.id}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
              p.background !== ''
                ? 'bg-green-600/30 border-green-500 text-green-400'
                : 'bg-midnight-700 border-midnight-600 text-slate-500'
            }`}
          >
            {p.background !== ''
              ? BACKGROUNDS.find((b) => b.label === p.background)?.emoji ?? '✓'
              : p.name[0]}
          </div>
        ))}
      </div>
      <p className="text-center text-slate-500 text-xs">
        {readyPlayers.length}/{room.players.length} 준비 완료
      </p>

      {/* 확인 버튼 */}
      {!hasSubmitted && (
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !selectedBg}
          className="w-full py-4 bg-arcane text-white font-bold text-lg rounded border-2 border-arcane-light active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
        >
          이걸로 간다
        </button>
      )}
    </div>
  );
}
