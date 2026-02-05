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
  WAVE_TEMPLATES,
  scaleEnemy,
  buildNarrative,
  NEXT_WAVE_PREVIEWS,
} from './data/hardcodedData.js';

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

  /**
   * 웨이브 시작: 적 생성 → 선택지 배분 → wave_intro emit → 2초 후 choosing
   */
  startWave(room: Room): void {
    const waveIndex = (room.run?.currentWave ?? 1) - 1;
    const template = WAVE_TEMPLATES[Math.min(waveIndex, WAVE_TEMPLATES.length - 1)];
    const alivePlayers = room.players.filter((p) => p.isAlive);

    // 적 스케일링
    this.currentEnemy = scaleEnemy(template, alivePlayers.length);

    // 상태 초기화
    this.pendingChoices.clear();
    this.pendingRolls.clear();
    this.actions = [];
    this.votes.clear();

    // 배경별 선택지 생성
    this.playerChoiceSets.clear();
    for (const player of alivePlayers) {
      const bgChoices = template.choicesByBackground[player.background] ?? template.defaultChoices;
      const options: ChoiceOption[] = bgChoices.map((c, i) => ({
        id: `${player.id}-choice-${i}`,
        text: c.text,
        category: c.category,
        baseDC: c.baseDC,
      }));

      const choiceSet: PlayerChoiceSet = { playerId: player.id, options };
      this.playerChoiceSets.set(player.id, choiceSet);
    }

    // phase → wave_intro
    roomManager.setPhase(this.roomCode, 'wave_intro');

    // 각 플레이어에게 자기만의 선택지 전송
    for (const player of alivePlayers) {
      const myChoices = this.playerChoiceSets.get(player.id);
      this.io.to(player.socketId).emit(SOCKET_EVENTS.WAVE_INTRO, {
        waveNumber: room.run?.currentWave ?? 1,
        enemy: this.currentEnemy,
        situation: template.situation,
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
      this.resolveWave(room);
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

  private resolveWave(room: Room): void {
    if (!this.currentEnemy || !room.run) return;

    // 1. 데미지 계산
    const damageResult = calculateDamage(this.actions, this.currentEnemy);

    // 2. 적 HP 감소
    this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - damageResult.enemyDamage);
    damageResult.enemyDefeated = this.currentEnemy.hp <= 0;

    // 3. 플레이어 HP 감소
    const updatedPlayers = applyDamageToPlayers(room.players, damageResult);
    roomManager.updatePlayers(this.roomCode, updatedPlayers);

    // 4. 내러티브 생성
    const narrative = buildNarrative(this.actions, this.currentEnemy.name, damageResult.enemyDefeated);

    // 5. ROLL_RESULTS emit → narrating
    roomManager.setPhase(this.roomCode, 'narrating');
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.ROLL_RESULTS, { actions: this.actions });
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.PHASE_CHANGE, { phase: 'narrating' });

    // 6. 2초 후 WAVE_NARRATIVE emit
    setTimeout(() => {
      this.io.to(this.roomCode).emit(SOCKET_EVENTS.WAVE_NARRATIVE, {
        narrative,
        damageResult,
      });

      // 7. 3초 후 WAVE_END → wave_result
      setTimeout(() => {
        this.emitWaveEnd(room, damageResult);
      }, 3000);
    }, 2000);
  }

  private emitWaveEnd(room: Room, damageResult: import('@round-midnight/shared').DamageResult): void {
    if (!room.run) return;

    const refreshedRoom = roomManager.getRoom(this.roomCode);
    if (!refreshedRoom) return;

    const alivePlayers = refreshedRoom.players.filter((p) => p.isAlive);
    const allDead = alivePlayers.length === 0;
    const waveNumber = refreshedRoom.run?.currentWave ?? 1;
    const isLastWave = waveNumber >= WAVE_TEMPLATES.length;

    // 전멸 → 바로 run_end
    if (allDead) {
      this.endRun(refreshedRoom, 'wipe');
      return;
    }

    // 클리어 (마지막 웨이브 + 적 격파)
    if (isLastWave && damageResult.enemyDefeated) {
      this.endRun(refreshedRoom, 'clear');
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
      this.endRun(refreshedRoom, 'retreat');
    } else {
      // 적이 살아있으면 같은 웨이브 다시, 죽었으면 다음 웨이브
      if (this.currentEnemy && this.currentEnemy.hp > 0) {
        // 같은 웨이브 재시도
        this.startWave(refreshedRoom);
      } else {
        // 다음 웨이브
        const runState = roomManager.advanceWave(this.roomCode);
        if (runState) {
          this.startWave(roomManager.getRoom(this.roomCode)!);
        }
      }
    }
  }

  private endRun(room: Room, result: 'retreat' | 'wipe' | 'clear'): void {
    roomManager.endRun(this.roomCode);

    const payload: RunEndPayload = {
      result,
      totalLoot: room.run?.accumulatedLoot ?? [],
      highlights: this.generateHighlights(result),
      waveHistory: room.run?.waveHistory ?? [],
    };

    this.io.to(this.roomCode).emit(SOCKET_EVENTS.RUN_END, payload);
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.PHASE_CHANGE, { phase: 'run_end' });
    this.cleanup();
  }

  private generateHighlights(result: 'retreat' | 'wipe' | 'clear'): string[] {
    if (result === 'clear') {
      return ['야시장의 주인을 물리쳤다!', '모두 무사히 살아남았다.', '오늘 밤은 승리의 야식이다!'];
    }
    if (result === 'retreat') {
      return ['현명한 후퇴도 용기다.', '다음에는 더 강해져서 돌아오자.', '적어도 살아남았으니까.'];
    }
    return ['모두 쓰러졌다...', '야시장의 어둠이 모든 것을 삼켰다.', '다음엔... 더 잘할 수 있을 거야.'];
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
