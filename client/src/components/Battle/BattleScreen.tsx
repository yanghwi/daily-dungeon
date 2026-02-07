import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { EnemySprite, BattleEffects } from '../../assets';
import type { EffectType } from '../../assets/effects/BattleEffects';
import BattleBg from './BattleBg';
import PartyStatus from './PartyStatus';
import ChoiceCards from './ChoiceCards';
import DiceRoll from './DiceRoll';
import RollResults from './RollResults';
import NarrationBox from './NarrationBox';
import WaveEndChoice from './WaveEndChoice';
import MaintenanceScreen from './MaintenanceScreen';
import SituationBox from './SituationBox';

interface Props {
  onSubmitChoice: (choiceId: string) => void;
  onRoll: () => void;
  onVote: (decision: 'continue' | 'retreat') => void;
  onEquipItem?: (itemId: string) => void;
  onUnequipItem?: (itemId: string) => void;
  onUseConsumable?: (itemId: string) => void;
  onDiscardItem?: (itemId: string) => void;
}

/**
 * 전투 화면 — phase별 하위 컴포넌트 라우팅
 * 배경 레이어 + 적 스프라이트 + 파티 상태 + 이펙트 오버레이
 */
export default function BattleScreen({ onSubmitChoice, onRoll, onVote, onEquipItem, onUnequipItem, onUseConsumable, onDiscardItem }: Props) {
  const phase = useGameStore((s) => s.phase);
  const currentWave = useGameStore((s) => s.currentWave);
  const combatRound = useGameStore((s) => s.combatRound);
  const enemy = useGameStore((s) => s.enemy);
  const [activeEffect, setActiveEffect] = useState<EffectType>(null);
  const clearEffect = useCallback(() => setActiveEffect(null), []);

  // phase 전환 시 이펙트 트리거
  const prevPhase = useRef(phase);
  useEffect(() => {
    const prev = prevPhase.current;
    if (prev === phase) return;
    prevPhase.current = phase;

    if (phase === 'narrating') {
      // 주사위 → 내러티브: 플래시 후 흔들림
      setActiveEffect('damage-flash');
      const t = setTimeout(() => setActiveEffect('screen-shake'), 200);
      return () => clearTimeout(t);
    }
    if (phase === 'rolling') {
      setActiveEffect('dice-glow');
    }
    if ((phase === 'wave_result' || phase === 'maintenance') && enemy && enemy.hp <= 0) {
      setActiveEffect('victory-flash');
    }
    if (phase === 'run_end') {
      setActiveEffect(enemy && enemy.hp <= 0 ? 'victory-flash' : 'defeat-fade');
    }
  }, [phase, enemy]);

  const isBossWave = currentWave > 0 && currentWave % 5 === 0;
  const isFinalBoss = currentWave >= 10;

  return (
    <div className="flex-1 flex flex-col relative min-h-dvh">
      <BattleBg waveNumber={currentWave} />

      {/* 컨텐츠 레이어 */}
      <div className="relative flex-1 flex flex-col z-[1]">
        {/* 웨이브 번호 + 적 HP 바 */}
        <div className="px-3 pt-3">
          <div className="flex flex-col items-center gap-1">
            <span className={`font-title text-xs ${isBossWave ? 'text-tier-nat20 animate-pulse' : 'text-arcane-light'}`}>
              {isBossWave && (isFinalBoss ? 'FINAL BOSS - ' : 'BOSS - ')}
              WAVE {currentWave}
            </span>
            {enemy && (() => {
              const ratio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 0;
              const barColor =
                ratio > 0.5 ? 'bg-tier-critical' :
                ratio > 0.25 ? 'bg-gold' :
                'bg-tier-nat1';
              return (
                <div className={`w-48 eb-window !px-2 !py-1.5 ${isBossWave ? 'border-tier-nat20' : ''}`}>
                  <div className="font-title text-sm text-slate-200 text-center mb-1 truncate">
                    {enemy.name}
                  </div>
                  <div className="h-2.5 bg-midnight-900 border border-slate-600 rounded-sm overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ease-out ${barColor}`}
                      style={{ width: `${Math.max(0, ratio * 100)}%` }}
                    />
                  </div>
                  <div className="font-body text-sm text-slate-400 mt-0.5 text-center">
                    {enemy.hp}/{enemy.maxHp}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 적 스프라이트 — hp > 0일 때만 */}
        {enemy && enemy.hp > 0 && (
          <EnemySprite imageTag={enemy.imageTag} isBoss={isBossWave} />
        )}

        {/* 상황 묘사 (첫 라운드에서만, 이후 라운드는 선택지만) */}
        {(phase === 'wave_intro' || (phase === 'choosing' && combatRound <= 1)) && <SituationBox />}

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

        {/* wave_result: 전리품 표시 (3초) */}
        {phase === 'wave_result' && (
          <WaveEndChoice />
        )}

        {/* maintenance: 장비 관리 + 투표 */}
        {phase === 'maintenance' && (
          <MaintenanceScreen onVote={onVote} onEquipItem={onEquipItem} onUnequipItem={onUnequipItem} onUseConsumable={onUseConsumable} onDiscardItem={onDiscardItem} />
        )}

        {/* 파티 HP (하단) */}
        <PartyStatus />
      </div>

      {/* 이펙트 오버레이 */}
      <BattleEffects activeEffect={activeEffect} onAnimationEnd={clearEffect} />
    </div>
  );
}
