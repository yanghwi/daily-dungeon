import { Server } from 'socket.io';
import type {
  Character,
  PlayerAction,
  PlayerChoiceSet,
  ChoiceOption,
  Enemy,
  WaveTurn,
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
import { generateSituation, generateCombatChoices } from '../ai/situationGenerator.js';
import { generateNarrative } from '../ai/narrativeGenerator.js';
import { generateHighlights } from '../ai/highlightsGenerator.js';
import { resolveEquippedEffects, getDcReduction } from './ItemEffectResolver.js';
import { generateLootFromCatalog, itemDefToLootItem } from './LootEngine.js';
import { addItemToInventory, toDisplayInventory } from './InventoryManager.js';
import { logger } from '../logger.js';
import { saveRunResult } from '../db/runSaver.js';

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

  private combatRound: number = 0;

  private choiceTimer: ReturnType<typeof setTimeout> | null = null;
  private rollTimer: ReturnType<typeof setTimeout> | null = null;
  private voteTimer: ReturnType<typeof setTimeout> | null = null;
  private introTimer: ReturnType<typeof setTimeout> | null = null;
  private maintenanceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(roomCode: string, io: Server) {
    this.roomCode = roomCode;
    this.io = io;
  }

  // 현재 웨이브의 상황 묘사 (내러티브 생성 시 재사용)
  private currentSituation: string = '';
  private lastNarrative: string = '';

  /**
   * 웨이브 시작: LLM으로 상황 생성 → 선택지 배분 → wave_intro emit → 2초 후 choosing
   */
  async startWave(room: Room): Promise<void> {
    const waveNumber = room.run?.currentWave ?? 1;
    const alivePlayers = room.players.filter((p) => p.isAlive);

    // 상태 초기화
    this.combatRound = 1;
    this.pendingChoices.clear();
    this.pendingRolls.clear();
    this.actions = [];
    this.votes.clear();

    // wave_heal 효과 적용 (웨이브 시작 시 힐)
    for (const player of alivePlayers) {
      const resolved = resolveEquippedEffects(player);
      if (resolved.waveHealAmount > 0) {
        player.hp = Math.min(player.maxHp, player.hp + resolved.waveHealAmount);
      }
    }
    roomManager.updatePlayers(this.roomCode, room.players);

    // phase → wave_intro (LLM 호출 동안 로딩 표시)
    roomManager.setPhase(this.roomCode, 'wave_intro');
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.PHASE_CHANGE, { phase: 'wave_intro' });

    // LLM 또는 폴백으로 상황/적/선택지 생성
    const result = await generateSituation(
      waveNumber,
      room.run?.maxWaves ?? GAME_CONSTANTS.MAX_WAVES,
      alivePlayers,
    );

    this.currentEnemy = result.enemy;
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

    // 1초 후 choosing phase로 전환
    this.introTimer = setTimeout(() => {
      roomManager.setPhase(this.roomCode, 'choosing');
      this.io.to(this.roomCode).emit(SOCKET_EVENTS.PHASE_CHANGE, { phase: 'choosing' });

      // 10초 선택 타이머
      this.choiceTimer = setTimeout(() => {
        this.autoFillChoices(room);
      }, GAME_CONSTANTS.CHOICE_TIMEOUT);
    }, 1000);
  }

  /**
   * 멀티라운드 전투: 적 생존 시 선택지만 재생성 → choosing 전환
   */
  async continueCombat(room: Room): Promise<void> {
    this.combatRound++;
    const alivePlayers = room.players.filter((p) => p.isAlive);

    // 상태 초기화 (선택/굴림만)
    this.pendingChoices.clear();
    this.pendingRolls.clear();
    const previousActions = [...this.actions];
    this.actions = [];

    // wave_heal 적용
    for (const player of alivePlayers) {
      const resolved = resolveEquippedEffects(player);
      if (resolved.waveHealAmount > 0) {
        player.hp = Math.min(player.maxHp, player.hp + resolved.waveHealAmount);
      }
    }
    roomManager.updatePlayers(this.roomCode, room.players);

    // 선택지만 재생성 (상황/적은 기존 유지)
    const waveNumber = room.run?.currentWave ?? 1;
    const newChoices = await generateCombatChoices(
      this.currentSituation, this.currentEnemy!, this.combatRound,
      waveNumber, alivePlayers, previousActions,
    );
    this.playerChoiceSets = newChoices;

    // COMBAT_CHOICES emit → choosing
    for (const player of alivePlayers) {
      const myChoices = this.playerChoiceSets.get(player.id);
      this.io.to(player.socketId).emit(SOCKET_EVENTS.COMBAT_CHOICES, {
        combatRound: this.combatRound,
        playerChoices: myChoices ? [myChoices] : [],
      });
    }

    roomManager.setPhase(this.roomCode, 'choosing');
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.PHASE_CHANGE, { phase: 'choosing' });

    // 10초 선택 타이머
    this.choiceTimer = setTimeout(() => {
      this.autoFillChoices(room);
    }, GAME_CONSTANTS.CHOICE_TIMEOUT);
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

    // 장착 아이템 효과 집계
    const resolved = resolveEquippedEffects(player);

    // reroll — N번 굴려서 최고값 사용
    let roll = rollDice();
    for (let i = 0; i < resolved.rerollCount; i++) {
      roll = Math.max(roll, rollDice());
    }

    const bonus = calculateBonus(player, pending.choice.category, resolved);

    // min_raise — 최소 주사위 값 보장
    let finalRoll = resolved.minRaise > 0 ? Math.max(roll, resolved.minRaise) : roll;

    // dc_reduction — 카테고리별 DC 감소
    const dcReduction = getDcReduction(resolved, pending.choice.category);
    const adjustedDC = Math.max(1, pending.choice.baseDC - dcReduction);

    const effectiveRoll = finalRoll + bonus;

    // crit_expand — critical 판정 기준
    const tier = determineTier(finalRoll, effectiveRoll, adjustedDC, resolved.critMin);

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
      this.resolveWave(room).catch((err) => logger.error('resolveWave failed', { room: this.roomCode, error: err instanceof Error ? err.message : String(err) }));
    }
  }

  /**
   * 계속/철수 투표
   */
  handleVote(playerId: string, decision: 'continue' | 'retreat', room: Room): void {
    if (this.votes.has(playerId)) return;

    this.votes.set(playerId, decision);

    // 투표 현황 브로드캐스트
    const alivePlayers = room.players.filter((p) => p.isAlive);
    const retreatCount = Array.from(this.votes.values()).filter((v) => v === 'retreat').length;
    const continueCount = this.votes.size - retreatCount;
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.VOTE_UPDATE, {
      continueCount,
      retreatCount,
      total: alivePlayers.length,
    });

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
    this.clearTimer('maintenance');
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

    // 1. 데미지 계산 (플레이어별 damage_multiplier 집계)
    const playerMultipliers = new Map<string, { damageMultiplier: number; bossDamageMultiplier: number }>();
    for (const player of room.players.filter((p) => p.isAlive)) {
      const resolved = resolveEquippedEffects(player);
      playerMultipliers.set(player.id, {
        damageMultiplier: resolved.damageMultiplier,
        bossDamageMultiplier: resolved.bossDamageMultiplier,
      });
    }
    const isBossWave = (room.run?.currentWave ?? 1) % 5 === 0;
    const damageResult = calculateDamage(this.actions, this.currentEnemy, playerMultipliers, isBossWave);

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
      new Promise<void>((resolve) => setTimeout(resolve, 1000)),
    ]);

    // 6. WAVE_NARRATIVE emit (HP 데이터 포함 → 클라이언트 즉시 반영)
    this.lastNarrative = narrative;
    const refreshedRoom = roomManager.getRoom(this.roomCode);
    const partyStatus = (refreshedRoom ?? room).players.map((p) => ({
      playerId: p.id,
      name: p.name,
      hp: p.hp,
      maxHp: p.maxHp,
    }));
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.WAVE_NARRATIVE, {
      narrative,
      damageResult,
      partyStatus,
      enemyHp: this.currentEnemy!.hp,
    });

    // 7. 버프 만료 처리
    this.expireBuffs();

    // 8. 1.5초 후 분기: 적 생존 → continueCombat, 적 사망 → emitWaveEnd
    setTimeout(() => {
      const refreshedRoom2 = roomManager.getRoom(this.roomCode);
      if (!refreshedRoom2) return;

      if (this.currentEnemy && this.currentEnemy.hp > 0) {
        // 적 생존 → 다음 전투 라운드
        this.continueCombat(refreshedRoom2).catch((err) =>
          logger.error('continueCombat failed', { room: this.roomCode, error: err instanceof Error ? err.message : String(err) }));
      } else {
        // 적 사망 → 전리품 + 정비
        this.emitWaveEnd(refreshedRoom2, damageResult);
      }
    }, 1500);
  }

  private emitWaveEnd(room: Room, damageResult: import('@round-midnight/shared').DamageResult): void {
    if (!room.run) return;

    const refreshedRoom = roomManager.getRoom(this.roomCode);
    if (!refreshedRoom) return;

    // 적은 항상 사망 상태에서 이 함수가 호출됨
    const waveNumber = refreshedRoom.run?.currentWave ?? 1;
    const isBoss = waveNumber % 5 === 0;

    // 루트 생성 + 자동 분배 (보스는 더 많이)
    if (refreshedRoom.run) {
      const alivePlrs = refreshedRoom.players.filter((p) => p.isAlive);
      const lootCount = isBoss ? alivePlrs.length + 1 : alivePlrs.length;
      const lootItems = generateLootFromCatalog(lootCount, { waveNumber, isBossWave: isBoss });
      const lootList = lootItems.map(itemDefToLootItem);
      damageResult.loot = lootList;
      refreshedRoom.run.accumulatedLoot.push(...lootList);

      // 자동 분배: 각 플레이어에게 1개씩
      for (let i = 0; i < Math.min(alivePlrs.length, lootList.length); i++) {
        const player = alivePlrs[i];
        const loot = lootList[i];
        loot.assignedTo = player.name;

        if (player.inventory.length >= GAME_CONSTANTS.MAX_RUN_INVENTORY) {
          loot.inventoryFull = true;
          continue;
        }

        const updated = addItemToInventory(player, loot.itemId);
        roomManager.updateCharacter(this.roomCode, updated);

        this.io.to(player.socketId).emit(SOCKET_EVENTS.INVENTORY_UPDATED, {
          inventory: toDisplayInventory(updated.inventory),
          equipment: updated.equipment,
          hp: updated.hp,
          maxHp: updated.maxHp,
          activeBuffs: updated.activeBuffs,
        });
      }
    }

    // 웨이브 히스토리 기록
    if (refreshedRoom.run && this.currentEnemy) {
      refreshedRoom.run.waveHistory.push({
        waveNumber: refreshedRoom.run.currentWave,
        situation: this.currentSituation,
        enemy: { ...this.currentEnemy },
        playerChoices: Array.from(this.playerChoiceSets.values()),
        playerActions: [...this.actions],
        narrative: this.lastNarrative,
        damageResult,
      });
    }

    const alivePlayers = refreshedRoom.players.filter((p) => p.isAlive);
    const allDead = alivePlayers.length === 0;
    const isLastWave = waveNumber >= (refreshedRoom.run?.maxWaves ?? GAME_CONSTANTS.MAX_WAVES);

    // 전멸 → 바로 run_end
    if (allDead) {
      this.endRun(refreshedRoom, 'wipe').catch((err) => logger.error('endRun failed', { room: this.roomCode, error: err instanceof Error ? err.message : String(err) }));
      return;
    }

    // 클리어 (마지막 웨이브 + 적 격파)
    if (isLastWave) {
      this.endRun(refreshedRoom, 'clear').catch((err) => logger.error('endRun failed', { room: this.roomCode, error: err instanceof Error ? err.message : String(err) }));
      return;
    }

    // wave_result: 전리품 표시 (3초)
    const partyStatus = refreshedRoom.players.map((p) => ({
      playerId: p.id,
      name: p.name,
      hp: p.hp,
      maxHp: p.maxHp,
    }));

    const nextPreview = NEXT_WAVE_PREVIEWS[Math.min(waveNumber, NEXT_WAVE_PREVIEWS.length - 1)];

    const payload: WaveEndPayload = {
      partyStatus,
      loot: damageResult.loot,
      nextWavePreview: nextPreview || undefined,
    };

    roomManager.setPhase(this.roomCode, 'wave_result');
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.WAVE_END, payload);
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.PHASE_CHANGE, { phase: 'wave_result' });

    // 3초 후 maintenance 전환
    this.maintenanceTimer = setTimeout(() => {
      this.transitionToMaintenance(refreshedRoom);
    }, 3000);
  }

  private transitionToMaintenance(room: Room): void {
    const refreshedRoom = roomManager.getRoom(this.roomCode);
    if (!refreshedRoom) return;

    this.votes.clear();

    const partyStatus = refreshedRoom.players.map((p) => ({
      playerId: p.id,
      name: p.name,
      hp: p.hp,
      maxHp: p.maxHp,
    }));

    const waveNumber = refreshedRoom.run?.currentWave ?? 1;
    const nextPreview = NEXT_WAVE_PREVIEWS[Math.min(waveNumber, NEXT_WAVE_PREVIEWS.length - 1)];

    roomManager.setPhase(this.roomCode, 'maintenance');
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.MAINTENANCE_START, {
      partyStatus,
      loot: refreshedRoom.run?.accumulatedLoot ?? [],
      nextWavePreview: nextPreview || undefined,
    });
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.PHASE_CHANGE, { phase: 'maintenance' });

    // 45초 투표 타이머
    this.voteTimer = setTimeout(() => {
      this.autoVoteContinue(refreshedRoom);
    }, GAME_CONSTANTS.MAINTENANCE_TIMEOUT);
  }

  private resolveVote(room: Room): void {
    const refreshedRoom = roomManager.getRoom(this.roomCode);
    if (!refreshedRoom || !refreshedRoom.run) return;

    const retreatCount = Array.from(this.votes.values()).filter((v) => v === 'retreat').length;
    const total = this.votes.size;
    const majority = retreatCount > total / 2;

    if (majority) {
      this.endRun(refreshedRoom, 'retreat').catch((err) => logger.error('endRun failed', { room: this.roomCode, error: err instanceof Error ? err.message : String(err) }));
    } else {
      // 적은 항상 사망 상태 → 다음 웨이브
      const runState = roomManager.advanceWave(this.roomCode);
      if (runState) {
        this.startWave(roomManager.getRoom(this.roomCode)!).catch((err) => logger.error('startWave failed', { room: this.roomCode, error: err instanceof Error ? err.message : String(err) }));
      }
    }
  }

  private async endRun(room: Room, result: 'retreat' | 'wipe' | 'clear'): Promise<void> {
    const waveCount = room.run?.currentWave ?? 1;
    const players = room.players;
    const dailySeedId = room.run?.dailySeedId;
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

    // DB 저장 (비동기, 게임 플로우 블로킹 안 함)
    saveRunResult({
      roomCode: this.roomCode,
      result,
      wavesCleared: waveCount,
      highlights,
      dailySeedId,
      players,
    }).catch((err) => logger.error('Failed to save run result', {
      room: this.roomCode,
      error: err instanceof Error ? err.message : String(err),
    }));
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

  private expireBuffs(): void {
    const refreshedRoom = roomManager.getRoom(this.roomCode);
    if (!refreshedRoom) return;

    for (const player of refreshedRoom.players) {
      if (!player.activeBuffs || player.activeBuffs.length === 0) continue;

      const updated = player.activeBuffs
        .map((b) => ({ ...b, remainingWaves: b.remainingWaves - 1 }))
        .filter((b) => b.remainingWaves > 0);

      if (updated.length !== player.activeBuffs.length) {
        player.activeBuffs = updated;
        roomManager.updateCharacter(this.roomCode, player);

        // 버프 변경 알림
        this.io.to(player.socketId).emit(SOCKET_EVENTS.INVENTORY_UPDATED, {
          inventory: toDisplayInventory(player.inventory),
          equipment: player.equipment,
          hp: player.hp,
          maxHp: player.maxHp,
          activeBuffs: player.activeBuffs,
        });
      }
    }
  }

  private clearTimer(type: 'intro' | 'choice' | 'roll' | 'vote' | 'maintenance'): void {
    const timerMap = {
      intro: 'introTimer',
      choice: 'choiceTimer',
      roll: 'rollTimer',
      vote: 'voteTimer',
      maintenance: 'maintenanceTimer',
    } as const;

    const key = timerMap[type];
    if (this[key]) {
      clearTimeout(this[key]!);
      this[key] = null;
    }
  }
}
