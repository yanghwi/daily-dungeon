import { useState } from 'react';
import type { Room, Character } from '@round-midnight/shared';
import { BACKGROUNDS } from '../../styles/theme';
import LobbyBg from './LobbyBg';
import CharacterCreator from './CharacterCreator';
import type { CharacterAppearance } from '../../assets/sprites/characterParts';

interface CharacterSetupProps {
  room: Room;
  player: Character;
  onSubmit: (name: string, background: string) => void;
}

export default function CharacterSetup({ room, player, onSubmit }: CharacterSetupProps) {
  const [name, setName] = useState(player.name);
  const [selectedBg, setSelectedBg] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [_appearance, setAppearance] = useState<CharacterAppearance | null>(null);
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
    <div className="flex-1 flex flex-col px-6 py-6 gap-5 relative min-h-dvh">
      <LobbyBg />

      {/* 헤더 */}
      <div className="text-center relative z-10">
        <h2 className="font-title text-sm sm:text-base text-white lobby-title">캐릭터 설정</h2>
        <p className="font-body text-sm text-gold mt-2 lobby-subtitle">
          당신은 누구입니까?
        </p>
      </div>

      {/* 이름 수정 */}
      {!hasSubmitted && (
        <div className="relative z-10">
          <div className="eb-window !p-0">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={10}
              placeholder="이름"
              className="w-full px-4 py-3 bg-transparent text-white text-center font-body text-lg focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* 배경 선택 카드 */}
      {!hasSubmitted ? (
        <div className="flex-1 flex flex-col gap-3 relative z-10">
          <p className="font-body text-sm text-slate-400">배경을 선택하세요</p>
          {BACKGROUNDS.map((bg) => {
            const isTaken = takenBackgrounds.includes(bg.label);
            const isSelected = selectedBg === bg.label;

            return (
              <button
                key={bg.id}
                onClick={() => !isTaken && setSelectedBg(bg.label)}
                disabled={isTaken}
                className={`w-full text-left eb-window transition-all active:scale-[0.98] ${
                  isSelected
                    ? '!border-arcane-light !shadow-[4px_4px_0_rgba(108,92,231,0.5)]'
                    : isTaken
                      ? '!border-slate-700 opacity-40'
                      : '!border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{bg.emoji}</span>
                  <div className="flex-1">
                    <p className="font-body text-white font-bold">
                      {bg.label}
                      {isTaken && <span className="text-slate-500 text-xs ml-2">(선택됨)</span>}
                    </p>
                    <p className="font-body text-slate-400 text-xs mt-0.5">{bg.description}</p>
                    {isSelected && (
                      <p className="font-body text-arcane-light text-xs mt-1 italic">
                        {getBackgroundFlavorText(bg.label)}
                      </p>
                    )}
                  </div>
                  {isSelected && <span className="text-arcane-light font-body text-xl">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* 선택 완료 - 대기 화면 */
        <div className="flex-1 flex flex-col items-center justify-center gap-4 relative z-10">
          <div className="eb-window text-center">
            <p className="text-5xl mb-3">
              {BACKGROUNDS.find((b) => b.label === player.background)?.emoji ?? '?'}
            </p>
            <p className="font-body text-white text-xl font-bold">{player.name}</p>
            <p className="font-body text-arcane-light">{player.background}</p>
            <p className="font-body text-slate-400 text-sm mt-1">특성: {player.trait}</p>
            <p className="font-body text-slate-400 text-sm">약점: {player.weakness}</p>
          </div>
          <p className="font-body text-slate-500 text-sm animate-pulse">
            다른 플레이어를 기다리는 중...
          </p>
        </div>
      )}

      {/* 준비 현황 */}
      <div className="flex gap-2 justify-center relative z-10">
        {room.players.map((p) => (
          <div
            key={p.id}
            className={`eb-window !p-2 flex items-center justify-center text-sm font-bold ${
              p.background !== ''
                ? '!border-tier-critical'
                : '!border-slate-700'
            }`}
          >
            <span className={p.background !== '' ? 'font-body text-tier-critical' : 'font-body text-slate-500'}>
              {p.background !== ''
                ? BACKGROUNDS.find((b) => b.label === p.background)?.emoji ?? '✓'
                : p.name[0]}
            </span>
          </div>
        ))}
      </div>
      <p className="text-center font-body text-slate-500 text-xs relative z-10">
        {readyPlayers.length}/{room.players.length} 준비 완료
      </p>

      {/* 외형 커스텀 */}
      {!hasSubmitted && selectedBg && (
        <div className="relative z-10">
          {showCreator ? (
            <CharacterCreator
              onConfirm={(app) => {
                setAppearance(app);
                setShowCreator(false);
              }}
            />
          ) : (
            <button
              onClick={() => setShowCreator(true)}
              className="w-full eb-window !border-slate-500 text-center active:scale-95 transition-transform"
            >
              <span className="font-title text-xs text-slate-300">외형 커스텀</span>
            </button>
          )}
        </div>
      )}

      {/* 확인 버튼 */}
      {!hasSubmitted && (
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !selectedBg}
          className="w-full eb-window !border-gold text-center active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100 relative z-10"
        >
          <span className="font-title text-base text-gold">이걸로 간다</span>
        </button>
      )}
    </div>
  );
}
