import { useGameStore } from '../../stores/gameStore';
import BattleBg from './BattleBg';
import PartyStatus from './PartyStatus';
import ChoiceCards from './ChoiceCards';
import DiceRoll from './DiceRoll';
import RollResults from './RollResults';
import NarrationBox from './NarrationBox';
import WaveEndChoice from './WaveEndChoice';

interface Props {
  onSubmitChoice: (choiceId: string) => void;
  onRoll: () => void;
  onVote: (decision: 'continue' | 'retreat') => void;
}

/**
 * 전투 화면 — phase별 하위 컴포넌트 라우팅
 * 배경 레이어 + 스캔라인 + PartyStatus 상시 표시
 */
export default function BattleScreen({ onSubmitChoice, onRoll, onVote }: Props) {
  const phase = useGameStore((s) => s.phase);
  const currentWave = useGameStore((s) => s.currentWave);
  const enemy = useGameStore((s) => s.enemy);
  const situation = useGameStore((s) => s.situation);

  return (
    <div className="flex-1 flex flex-col relative min-h-dvh">
      <BattleBg />

      {/* 컨텐츠 레이어 */}
      <div className="relative flex-1 flex flex-col" style={{ zIndex: 1 }}>
        {/* 웨이브 번호 + 적 정보 */}
        <div className="px-3 pt-3">
          <div className="flex items-center justify-between">
            <span className="font-title text-[10px] text-arcane-light">WAVE {currentWave}</span>
            {enemy && (
              <span className="font-title text-[10px] text-slate-400">
                {enemy.name} HP {enemy.hp}/{enemy.maxHp}
              </span>
            )}
          </div>
        </div>

        {/* 파티 HP */}
        <PartyStatus />

        {/* 상황 묘사 (wave_intro, choosing) */}
        {(phase === 'wave_intro' || phase === 'choosing') && situation && (
          <div className="px-3 mt-2">
            <div className="eb-window">
              <p className="font-body text-sm text-slate-200 leading-relaxed">
                {situation}
              </p>
            </div>
          </div>
        )}

        {/* wave_intro: 로딩 표시 */}
        {phase === 'wave_intro' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="font-body text-sm text-slate-400 animate-pulse">
              상황 파악 중...
            </div>
          </div>
        )}

        {/* choosing: 선택지 */}
        {phase === 'choosing' && (
          <ChoiceCards onSubmitChoice={onSubmitChoice} />
        )}

        {/* rolling: 주사위 */}
        {phase === 'rolling' && (
          <DiceRoll onRoll={onRoll} />
        )}

        {/* narrating: 결과 + 내러티브 */}
        {phase === 'narrating' && (
          <>
            <RollResults />
            <NarrationBox />
          </>
        )}

        {/* wave_result: 투표 */}
        {phase === 'wave_result' && (
          <WaveEndChoice onVote={onVote} />
        )}
      </div>
    </div>
  );
}
