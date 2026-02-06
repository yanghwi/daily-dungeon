import { Server } from 'socket.io';
import type {
  Character,
  PlayerAction,
  PlayerChoiceSet,
  ChoiceOption,
  Enemy,
  WaveEndPayload,
  RunEndPayload,
  Room,
} from '@round-midnight/shared';
import { SOCKET_EVENTS, GAME_CONSTANTS } from '@round-midnight/shared';
import { roomManager } from './Room.js';
import { rollDice, calculateBonus, determineTier } from './DiceEngine.js';
import { calculateDamage, applyDamageToPlayers } from './DamageCalculator.js';
import {
  NEXT_WAVE_PREVIEWS,
} from './data/hardcodedData.js';
import { generateSituation } from '../ai/situationGenerator.js';
import { generateNarrative } from '../ai/narrativeGenerator.js';
import { generateHighlights } from '../ai/highlightsGenerator.js';

interface PendingChoice {
  playerId: string;
  choiceId: string;
  choice: ChoiceOption;
}

export class WaveManager {
  private roomCode: string;
  private io: Server;

  private currentEnemy: Enemy | null = null;
  private playerChoiceSets: Map<string, PlayerChoiceSet> = new Map();
  private pendingChoices: Map<string, PendingChoice> = new Map();
  private pendingRolls: Map<string, boolean> = new Map(); // playerId → rolled?
  private actions: PlayerAction[] = [];
  private votes: Map<string, 'continue' | 'retreat'> = new Map();

  private choiceTimer: ReturnType<typeof setTimeout> | null = null;
  private rollTimer: ReturnType<typeof setTimeout> | null = null;
  private voteTimer: ReturnType<typeof setTimeout> | null = null;
  private introTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(roomCode: string, io: Server) {
    this.roomCode = roomCode;
    this.io = io;
  }

  // 현재 웨이브의 상황 묘사 (내러티브 생성 시 재사용)
  private currentSituation: string = '';

  /**
   * 웨이브 시작: LLM으로 상황 생성 → 선택지 배분 → wave_intro emit → 2초 후 choosing
   */
  async startWave(room: Room, retryEnemy?: Enemy): Promise<void> {
    const waveNumber = room.run?.currentWave ?? 1;
    const alivePlayers = room.players.filter((p) => p.isAlive);

    // 상태 초기화
    this.pendingChoices.clear();
    this.pendingRolls.clear();
    this.actions = [];
    this.votes.clear();

    // phase → wave_intro (LLM 호출 동안 로딩 표시)
    roomManager.setPhase(this.roomCode, 'wave_intro');
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.PHASE_CHANGE, { phase: 'wave_intro' });

    // LLM 또는 폴백으로 상황/적/선택지 생성
    const result = await generateSituation(
      waveNumber,
      room.run?.maxWaves ?? GAME_CONSTANTS.MAX_WAVES,
      alivePlayers,
    );

    // retry 시 기존 적 유지, 새 상황/선택지만 재생성
    this.currentEnemy = retryEnemy ?? result.enemy;
    this.currentSituation = result.situation;
    this.playerChoiceSets = result.playerChoiceSets;

    // 각 플레이어에게 자기만의 선택지 전송
    for (const player of alivePlayers) {
      const myChoices = this.playerChoiceSets.get(player.id);
      this.io.to(player.socketId).emit(SOCKET_EVENTS.WAVE_INTRO, {
        waveNumber,
        enemy: this.currentEnemy,
        situation: this.currentSituation,
        playerChoices: myChoices ? [myChoices] : [],
      });
    }

    // 2초 후 choosing phase로 전환
    this.introTimer = setTimeout(() => {
      roomManager.setPhase(this.roomCode, 'choosing');
      this.io.to(this.roomCode).emit(SOCKET_EVENTS.PHASE_CHANGE, { phase: 'choosing' });

      // 10초 선택 타이머
      this.choiceTimer = setTimeout(() => {
        this.autoFillChoices(room);
      }, GAME_CONSTANTS.CHOICE_TIMEOUT);
    }, 2000);
  }

  /**
   * 플레이어 선택지 처리
   */
  handlePlayerChoice(playerId: string, choiceId: string, room: Room): void {
    if (this.pendingChoices.has(playerId)) return; // 이미 선택함

    const choiceSet = this.playerChoiceSets.get(playerId);
    if (!choiceSet) return;

    const chosen = choiceSet.options.find((o) => o.id === choiceId);
    if (!chosen) return;

    this.pendingChoices.set(playerId, { playerId, choiceId, choice: chosen });

    const alivePlayers = room.players.filter((p) => p.isAlive);
    if (this.pendingChoices.size >= alivePlayers.length) {
      this.clearTimer('choice');
      this.transitionToRolling(room);
    }
  }

  /**
   * 주사위 굴림 처리
   */
  handleDiceRoll(playerId: string, room: Room): void {
    if (this.pendingRolls.has(playerId)) return; // 이미 굴림

    const player = room.players.find((p) => p.id === playerId);
    const pending = this.pendingChoices.get(playerId);
    if (!player || !pending) return;

    this.pendingRolls.set(playerId, true);

    const roll = rollDice();
    const bonus = calculateBonus(player, pending.choice.category);

    // 악세서리 효과: min_raise
    let finalRoll = roll;
    if (player.equipment.accessoryEffect.type === 'min_raise') {
      finalRoll = Math.max(roll, player.equipment.accessoryEffect.minValue);
    }

    const effectiveRoll = finalRoll + bonus;
    const tier = determineTier(finalRoll, effectiveRoll, pending.choice.baseDC);

    const action: PlayerAction = {
      playerId: player.id,
      playerName: player.name,
      choiceId: pending.choiceId,
      choiceText: pending.choice.text,
      category: pending.choice.category,
      roll: finalRoll,
      bonus,
      effectiveRoll,
      dc: pending.choice.baseDC,
      tier,
    };

    this.actions.push(action);

    const alivePlayers = room.players.filter((p) => p.isAlive);
    if (this.pendingRolls.size >= alivePlayers.length) {
      this.clearTimer('roll');
      this.resolveWave(room).catch((err) => console.error('[WaveManager] resolveWave 에러:', err));
    }
  }

  /**
   * 계속/철수 투표
   */
  handleVote(playerId: string, decision: 'continue' | 'retreat', room: Room): void {
    if (this.votes.has(playerId)) return;

    this.votes.set(playerId, decision);

    const alivePlayers = room.players.filter((p) => p.isAlive);
    if (this.votes.size >= alivePlayers.length) {
      this.clearTimer('vote');
      this.resolveVote(room);
    }
  }

  /**
   * 모든 타이머 정리
   */
  cleanup(): void {
    this.clearTimer('intro');
    this.clearTimer('choice');
    this.clearTimer('roll');
    this.clearTimer('vote');
  }

  // ── Private ──

  private transitionToRolling(room: Room): void {
    roomManager.setPhase(this.roomCode, 'rolling');

    const playerNames = Array.from(this.pendingChoices.values()).map((c) => {
      const player = room.players.find((p) => p.id === c.playerId);
      return player?.name ?? '???';
    });

    this.io.to(this.roomCode).emit(SOCKET_EVENTS.ALL_CHOICES_READY, { playerNames });
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.PHASE_CHANGE, { phase: 'rolling' });

    // 5초 롤 타이머
    this.rollTimer = setTimeout(() => {
      this.autoFillRolls(room);
    }, GAME_CONSTANTS.DICE_ROLL_TIMEOUT);
  }

  private async resolveWave(room: Room): Promise<void> {
    if (!this.currentEnemy || !room.run) return;

    // 1. 데미지 계산
    const damageResult = calculateDamage(this.actions, this.currentEnemy);

    // 2. 적 HP 감소
    this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - damageResult.enemyDamage);
    damageResult.enemyDefeated = this.currentEnemy.hp <= 0;

    // 3. 플레이어 HP 감소
    const updatedPlayers = applyDamageToPlayers(room.players, damageResult);
    roomManager.updatePlayers(this.roomCode, updatedPlayers);

    // 4. ROLL_RESULTS emit → narrating (내러티브 생성 동안 주사위 결과 먼저 표시)
    roomManager.setPhase(this.roomCode, 'narrating');
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.ROLL_RESULTS, { actions: this.actions });
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.PHASE_CHANGE, { phase: 'narrating' });

    // 5. LLM 내러티브 생성 + 2초 딜레이 병렬 실행
    const [narrative] = await Promise.all([
      generateNarrative(
        this.currentSituation, this.currentEnemy.name, this.actions, damageResult.enemyDefeated,
      ),
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]);

    // 6. WAVE_NARRATIVE emit
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.WAVE_NARRATIVE, {
      narrative,
      damageResult,
    });

    // 7. 3초 후 WAVE_END → wave_result
    setTimeout(() => {
      this.emitWaveEnd(room, damageResult);
    }, 3000);
  }

  private emitWaveEnd(room: Room, damageResult: import('@round-midnight/shared').DamageResult): void {
    if (!room.run) return;

    const refreshedRoom = roomManager.getRoom(this.roomCode);
    if (!refreshedRoom) return;

    const alivePlayers = refreshedRoom.players.filter((p) => p.isAlive);
    const allDead = alivePlayers.length === 0;
    const waveNumber = refreshedRoom.run?.currentWave ?? 1;
    const isLastWave = waveNumber >= (refreshedRoom.run?.maxWaves ?? GAME_CONSTANTS.MAX_WAVES);

    // 전멸 → 바로 run_end
    if (allDead) {
      this.endRun(refreshedRoom, 'wipe').catch((err) => console.error('[WaveManager] endRun 에러:', err));
      return;
    }

    // 클리어 (마지막 웨이브 + 적 격파)
    if (isLastWave && damageResult.enemyDefeated) {
      this.endRun(refreshedRoom, 'clear').catch((err) => console.error('[WaveManager] endRun 에러:', err));
      return;
    }

    // 계속/철수 투표
    const canContinue = damageResult.enemyDefeated;
    const partyStatus = refreshedRoom.players.map((p) => ({
      playerId: p.id,
      name: p.name,
      hp: p.hp,
      maxHp: p.maxHp,
    }));

    const nextPreview = NEXT_WAVE_PREVIEWS[Math.min(waveNumber, NEXT_WAVE_PREVIEWS.length - 1)];

    const payload: WaveEndPayload = {
      canContinue,
      partyStatus,
      loot: damageResult.loot,
      nextWavePreview: nextPreview || undefined,
    };

    roomManager.setPhase(this.roomCode, 'wave_result');
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.WAVE_END, payload);
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.PHASE_CHANGE, { phase: 'wave_result' });

    // 적을 못 잡았으면 같은 웨이브 다시 (계속 투표 시)
    // 잡았으면 다음 웨이브로 진행
    if (!canContinue) {
      // 적이 안 죽음 → 같은 웨이브 재시도 (계속만 가능)
      // 30초 후 자동 계속
      this.voteTimer = setTimeout(() => {
        this.autoVoteContinue(refreshedRoom);
      }, GAME_CONSTANTS.VOTE_TIMEOUT);
    } else {
      // 30초 투표 타이머
      this.voteTimer = setTimeout(() => {
        this.autoVoteContinue(refreshedRoom);
      }, GAME_CONSTANTS.VOTE_TIMEOUT);
    }
  }

  private resolveVote(room: Room): void {
    const refreshedRoom = roomManager.getRoom(this.roomCode);
    if (!refreshedRoom || !refreshedRoom.run) return;

    const retreatCount = Array.from(this.votes.values()).filter((v) => v === 'retreat').length;
    const total = this.votes.size;
    const majority = retreatCount > total / 2; // 과반수 철수 시 철수, 동률은 계속

    if (majority) {
      this.endRun(refreshedRoom, 'retreat').catch((err) => console.error('[WaveManager] endRun 에러:', err));
    } else {
      // 적이 살아있으면 같은 웨이브 다시 (기존 적 전달), 죽었으면 다음 웨이브
      if (this.currentEnemy && this.currentEnemy.hp > 0) {
        this.startWave(refreshedRoom, this.currentEnemy).catch((err) => console.error('[WaveManager] startWave 에러:', err));
      } else {
        const runState = roomManager.advanceWave(this.roomCode);
        if (runState) {
          this.startWave(roomManager.getRoom(this.roomCode)!).catch((err) => console.error('[WaveManager] startWave 에러:', err));
        }
      }
    }
  }

  private async endRun(room: Room, result: 'retreat' | 'wipe' | 'clear'): Promise<void> {
    const waveCount = room.run?.currentWave ?? 1;
    const players = room.players;
    roomManager.endRun(this.roomCode);

    const highlights = await generateHighlights(result, players, waveCount);

    const payload: RunEndPayload = {
      result,
      totalLoot: room.run?.accumulatedLoot ?? [],
      highlights,
      waveHistory: room.run?.waveHistory ?? [],
    };

    this.io.to(this.roomCode).emit(SOCKET_EVENTS.RUN_END, payload);
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.PHASE_CHANGE, { phase: 'run_end' });
    this.cleanup();
  }

  // ── 타임아웃 자동 처리 ──

  private autoFillChoices(room: Room): void {
    const alivePlayers = room.players.filter((p) => p.isAlive);

    for (const player of alivePlayers) {
      if (!this.pendingChoices.has(player.id)) {
        const choiceSet = this.playerChoiceSets.get(player.id);
        if (choiceSet && choiceSet.options.length > 0) {
          const randomChoice = choiceSet.options[Math.floor(Math.random() * choiceSet.options.length)];
          this.pendingChoices.set(player.id, {
            playerId: player.id,
            choiceId: randomChoice.id,
            choice: randomChoice,
          });
        }
      }
    }

    this.transitionToRolling(room);
  }

  private autoFillRolls(room: Room): void {
    const alivePlayers = room.players.filter((p) => p.isAlive);

    for (const player of alivePlayers) {
      if (!this.pendingRolls.has(player.id)) {
        // 자동 주사위 굴림
        this.handleDiceRoll(player.id, room);
      }
    }
  }

  private autoVoteContinue(room: Room): void {
    const refreshedRoom = roomManager.getRoom(this.roomCode);
    if (!refreshedRoom) return;

    const alivePlayers = refreshedRoom.players.filter((p) => p.isAlive);
    for (const player of alivePlayers) {
      if (!this.votes.has(player.id)) {
        this.votes.set(player.id, 'continue');
      }
    }
    this.resolveVote(refreshedRoom);
  }

  private clearTimer(type: 'intro' | 'choice' | 'roll' | 'vote'): void {
    const timerMap = {
      intro: 'introTimer',
      choice: 'choiceTimer',
      roll: 'rollTimer',
      vote: 'voteTimer',
    } as const;

    const key = timerMap[type];
    if (this[key]) {
      clearTimeout(this[key]!);
      this[key] = null;
    }
  }
}
