# Round Midnight - Game Design Document

## 배경

"Round Midnight"는 4인 협동 웹 로그라이트 게임이다. 
현대 배경 + EarthBound 톤 + 1인칭 웨이브 기반 구조.
타겟: 30대 중반 남성 4인, 아이폰 사파리, 침대에서 15분.

현재 코어 루프에 세 가지 문제가 있다:
1. 전투 중 플레이어 에이전시 부족 (LLM 서술을 읽기만 함)
2. "계속/철수" 이항 선택만으로는 긴장감 소모가 빠름
3. 4인 협동이 코어 루프에 녹아있지 않음

이번 태스크는 **D&D식 "선택 + d20 주사위" 시스템**을 웨이브 구조에 결합하여 이 세 가지를 해결한다.

---

## 새로운 코어 루프

```
[웨이브 시작]
     │
     ▼
[1. LLM이 상황 묘사 + 4명 각자에게 서로 다른 선택지 생성]
     │
     ▼
[2. 4명 동시에 선택지 고름 (10초 제한)]
     │
     ▼
[3. 4명 동시에 d20 주사위 굴림]
     │  - 주사위 결과가 선택의 "실행 품질"을 결정
     │  - 같은 "정면 돌파"라도 18이면 일격, 3이면 발 미끄러짐
     │
     ▼
[4. LLM이 "4명의 선택 + 4개의 주사위 결과" 조합으로 전투 결과 서술]
     │  - EarthBound 톤으로 3~5문장
     │  - nat 1이면 황당한 재앙, nat 20이면 영웅적 순간
     │
     ▼
[5. 데미지 계산 및 적용]
     │
     ▼
[6. 웨이브 종료 시 선택: "더 들어간다" / "철수한다"]
     │
     ▼
[다음 웨이브 또는 런 종료]
```

핵심 원칙: **선택이 방향을 정하고, 주사위가 강도를 정한다.**

---

## 타입 정의

기존 shared/types.ts를 아래 구조로 교체하라.

```typescript
// ===== 캐릭터 =====

interface Character {
  id: string;
  name: string;                // 플레이어 입력
  background: string;          // "전직 경비원", "요리사", "개발자", "영업사원"
  trait: string;               // "용감한", "겁 많은", "호기심 많은", "말빨 좋은"
  weakness: string;            // "어둠을 무서워함", "거미 공포증" 등
  hp: number;
  maxHp: number;
  equipment: Equipment;
}

interface Equipment {
  weapon: string;              // "알루미늄 배트", "식칼", "노트북", "명함"
  armor: string;               // "두꺼운 패딩", "앞치마", "후디", "정장"
  accessory: string;           // "행운의 열쇠고리", "손목시계", "보조배터리"
  // 장비 효과
  weaponBonus: number;         // 물리 행동 시 주사위 보정 (예: +2)
  armorBonus: number;          // 방어 행동 시 주사위 보정
  accessoryEffect: AccessoryEffect;
}

type AccessoryEffect =
  | { type: 'reroll'; count: number }           // 주사위 다시 굴리기
  | { type: 'min_raise'; minValue: number }     // 최소 주사위 값 보장
  | { type: 'crit_expand'; critMin: number }    // 크리티컬 범위 확장 (기본 15)
  | { type: 'none' };

// ===== 웨이브 전투 =====

interface WaveTurn {
  waveNumber: number;
  situation: string;                 // LLM이 생성한 상황 묘사
  enemy: Enemy;
  playerChoices: PlayerChoiceSet[];  // 4명 각자의 선택지 세트
  playerActions: PlayerAction[];     // 4명의 선택 + 주사위 결과
  narrative: string;                 // LLM이 생성한 결과 서술
  damageResult: DamageResult;
}

interface Enemy {
  name: string;                // "떠돌이 개 무리", "이상한 자판기"
  description: string;         // LLM이 생성한 1줄 설명
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  imageTag: string;            // 에셋 DB 매칭용 태그
}

interface PlayerChoiceSet {
  playerId: string;
  options: ChoiceOption[];     // 2~3개
}

interface ChoiceOption {
  id: string;
  text: string;                // "정면 돌파한다", "음식으로 유인한다"
  category: ActionCategory;    // 주사위 보정 계산용
  baseDC: number;              // 기본 난이도 (8~18)
}

type ActionCategory = 'physical' | 'social' | 'technical' | 'defensive' | 'creative';

interface PlayerAction {
  playerId: string;
  playerName: string;
  choiceId: string;
  choiceText: string;
  category: ActionCategory;
  roll: number;                // 원본 d20 결과 (1~20)
  bonus: number;               // 캐릭터 + 장비 보정
  effectiveRoll: number;       // roll + bonus
  dc: number;                  // 해당 선택지의 DC
  tier: RollTier;
}

type RollTier = 'nat1' | 'fail' | 'normal' | 'critical' | 'nat20';
// nat1: roll === 1 (항상 실패, 황당한 재앙)
// fail: effectiveRoll < dc (실패)
// normal: effectiveRoll >= dc && effectiveRoll < dc + 5 (보통 성공)
// critical: effectiveRoll >= dc + 5 (강력한 성공)
// nat20: roll === 20 (항상 성공, 영웅적 순간)

interface DamageResult {
  enemyDamage: number;         // 적에게 준 총 데미지
  playerDamages: { playerId: string; damage: number }[];  // 각자 받은 데미지
  enemyDefeated: boolean;
  loot: LootItem[];            // 적 처치 시 드랍
}

interface LootItem {
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable';
  description: string;
  effect: string;              // 사람이 읽을 수 있는 효과 설명
}

// ===== 런 상태 =====

interface RunState {
  roomCode: string;
  players: Character[];
  currentWave: number;
  maxWaves: number;            // 기본 10
  enemy: Enemy | null;
  accumulatedLoot: LootItem[];
  phase: RunPhase;
  waveHistory: WaveTurn[];     // 이번 런의 모든 웨이브 기록
}

type RunPhase =
  | 'waiting'           // 로비 대기
  | 'character_setup'   // 캐릭터 생성
  | 'wave_intro'        // LLM이 상황 + 선택지 생성 중
  | 'choosing'          // 4명이 선택지 고르는 중
  | 'rolling'           // 4명이 주사위 굴리는 중
  | 'narrating'         // LLM이 결과 서술 중
  | 'wave_result'       // 결과 표시 + 계속/철수 선택
  | 'run_end';          // 런 종료 (철수/전멸/클리어)

// ===== 소켓 이벤트 =====

// Server → Client
interface WaveIntroPayload {
  waveNumber: number;
  enemy: Enemy;
  situation: string;
  playerChoices: PlayerChoiceSet[];   // 이 클라이언트에 해당하는 선택지만 포함
}

interface AllChoicesReadyPayload {
  // 4명 전원 선택 완료, 주사위 굴림 단계로 전환
  playerNames: string[];              // 선택 완료한 순서
}

interface RollResultsPayload {
  actions: PlayerAction[];            // 4명의 선택 + 주사위 결과
}

interface WaveNarrativePayload {
  narrative: string;                  // LLM 결과 서술 (스트리밍 또는 전체)
  damageResult: DamageResult;
}

interface WaveEndPayload {
  canContinue: boolean;               // 적 처치 && 생존자 있음
  partyStatus: { playerId: string; name: string; hp: number; maxHp: number }[];
  loot: LootItem[];
  nextWavePreview?: string;           // "다음: 더 깊은 곳에서 이상한 소리가..."
}

interface RunEndPayload {
  result: 'retreat' | 'wipe' | 'clear';
  totalLoot: LootItem[];
  highlights: string[];               // LLM이 생성한 이번 런 하이라이트 3줄
  waveHistory: WaveTurn[];
}

// Client → Server
interface PlayerChoicePayload {
  choiceId: string;
}

interface DiceRollPayload {
  // 클라이언트가 "굴리기" 버튼 탭 시 전송
  // 실제 난수는 서버에서 생성 (치트 방지)
}

interface ContinueOrRetreatPayload {
  decision: 'continue' | 'retreat';
}
```

---

## 소켓 이벤트 흐름

```
[Server]                              [Client x 4]

── wave-intro ──────────────────────▶  상황 묘사 + 내 선택지 표시
                                       (각자 다른 선택지 받음)

◀── player-choice ─────────────────── 선택지 탭 (10초 제한)

── all-choices-ready ───────────────▶  "모두 선택 완료" + 주사위 UI 표시

◀── dice-roll ─────────────────────── "굴리기" 버튼 탭

── roll-results ────────────────────▶  4명의 주사위 결과 동시 공개
                                       (1~2초 애니메이션 후)

── wave-narrative ──────────────────▶  LLM 결과 서술 표시
                                       (스트리밍 또는 전체)

── wave-end ────────────────────────▶  결과 + 계속/철수 선택 UI

◀── continue-or-retreat ───────────── 계속 or 철수

── wave-intro (다음) ──────────────▶  ...반복...
   또는
── run-end ─────────────────────────▶  런 종료 결과
```

---

## LLM 프롬프트 설계

### 프롬프트 1: 상황 + 선택지 생성

```
시스템: 너는 EarthBound/Mother 시리즈의 톤을 가진 게임 마스터다.
현대 한국 교외를 배경으로, 기묘하고 유머러스하면서도 가끔 섬뜩한 상황을 만든다.
반드시 JSON으로만 응답하라.

입력:
- 웨이브 번호: {waveNumber} / {maxWaves}
- 파티:
  {각 캐릭터의 name, background, trait, weakness, 현재 HP}
- 이전 웨이브 요약: {직전 1~2개 웨이브의 1줄 요약}
- 런 이력 (선택적): {이전 런들의 하이라이트}

출력 JSON:
{
  "situation": "편의점 뒷골목에서 쓰레기통이 혼자 움직이고 있다. 안에서 낮은 으르렁거리는 소리가 들린다.",
  "enemy": {
    "name": "성난 너구리 가족",
    "description": "쓰레기통 갑옷을 두른 너구리 네 마리. 눈이 빨갛게 빛난다.",
    "hp": 80,
    "attack": 15,
    "defense": 5,
    "imageTag": "raccoon_urban_angry"
  },
  "playerChoices": [
    {
      "playerId": "{철수 ID}",
      "options": [
        { "id": "c1", "text": "배트를 휘두르며 쓰레기통을 걷어찬다", "category": "physical", "baseDC": 10 },
        { "id": "c2", "text": "뒤로 물러나며 방어 자세를 취한다", "category": "defensive", "baseDC": 8 }
      ]
    },
    {
      "playerId": "{영수 ID}",
      "options": [
        { "id": "c3", "text": "주머니의 육포로 너구리를 유인한다", "category": "creative", "baseDC": 12 },
        { "id": "c4", "text": "프라이팬을 방패처럼 들어올린다", "category": "defensive", "baseDC": 9 },
        { "id": "c5", "text": "냄새를 맡아 너구리의 약점을 파악한다", "category": "social", "baseDC": 14 }
      ]
    },
    ...
  ]
}

규칙:
- 각 플레이어의 선택지는 반드시 해당 캐릭터의 background, trait를 반영할 것
- 선택지 개수는 2~3개, 최소 하나는 캐릭터 전문 분야 (DC 낮음)
- weakness 관련 상황이면 해당 캐릭터에게 불리한 선택지(DC 높음) 포함
- 웨이브가 높을수록 적이 강하고 상황이 위험해짐
- 적 스탯은 waveNumber * 15 (HP), waveNumber * 3 + 10 (attack) 기준으로 ±20% 범위
```

### 프롬프트 2: 결과 서술 생성

```
시스템: 너는 EarthBound 톤의 전투 내레이터다.
4명의 행동과 주사위 결과를 받아 3~5문장의 전투 서술을 생성한다.
유머러스하고 기묘하되, 결과의 심각성은 정확히 반영하라.

입력:
- 상황: {situation}
- 적: {enemy.name} (HP {enemy.hp})
- 행동 결과:
  - 철수: "배트를 휘두르며 쓰레기통을 걷어찼다" → d20: 17 (크리티컬)
  - 영수: "육포로 너구리를 유인했다" → d20: 4 (실패)
  - 민수: "핸드폰 플래시로 위협했다" → d20: 11 (보통)
  - 준호: "말로 너구리를 달래려 했다" → d20: 1 (nat 1)

출력 JSON:
{
  "narrative": "철수의 배트가 쓰레기통을 정확히 때려 뚜껑이 하늘로 날아갔다. 너구리들이 잠시 기절한 사이, 영수가 꺼낸 육포에서는 안타깝게도 3년 묵은 냄새가 났다. 너구리 대장이 역겨운 표정을 지었다. 민수의 플래시가 너구리 한 마리의 눈을 비추자 비명을 지르며 도망쳤다. 준호는 너구리에게 진심 어린 사과를 시도했으나, 무릎을 꿇는 순간 너구리가 준호의 머리 위에 올라탔다.",
  "enemyDamage": 45,
  "playerDamages": [
    { "playerId": "cheolsu_id", "damage": 0 },
    { "playerId": "youngsu_id", "damage": 5 },
    { "playerId": "minsu_id", "damage": 0 },
    { "playerId": "junho_id", "damage": 15 }
  ]
}

규칙:
- nat 1: 반드시 황당하고 웃긴 재앙을 묘사 (해당 플레이어가 가장 많은 피해)
- nat 20: 반드시 영웅적이고 극적인 성공을 묘사 (적에게 큰 추가 데미지)
- critical: 의도한 대로 잘 성공, 약간의 보너스
- normal: 평범하게 성공
- fail: 실패하되 치명적이지는 않음 (약간의 피해)
- 서술은 반드시 EarthBound 톤: 일상적인 소재를 기묘하게, 진지한 상황을 유머러스하게
- 4명의 행동이 서로 영향을 주는 방식으로 서술 (A가 적을 밀었더니 B 쪽으로 날아왔다 등)
```

---

## 데미지 계산 공식

서버에서 LLM 응답과 별개로 데미지를 계산한다. LLM의 서술은 분위기용이고, 실제 수치는 서버가 결정한다.

```typescript
function calculateDamage(actions: PlayerAction[], enemy: Enemy): DamageResult {
  let totalEnemyDamage = 0;
  const playerDamages: { playerId: string; damage: number }[] = [];

  for (const action of actions) {
    const BASE_DAMAGE = 10;

    switch (action.tier) {
      case 'nat20':
        totalEnemyDamage += BASE_DAMAGE * 3;    // 30
        playerDamages.push({ playerId: action.playerId, damage: 0 });
        break;
      case 'critical':
        totalEnemyDamage += BASE_DAMAGE * 2;    // 20
        playerDamages.push({ playerId: action.playerId, damage: 0 });
        break;
      case 'normal':
        totalEnemyDamage += BASE_DAMAGE;         // 10
        playerDamages.push({ playerId: action.playerId, damage: Math.floor(enemy.attack * 0.3) });
        break;
      case 'fail':
        totalEnemyDamage += 0;
        playerDamages.push({ playerId: action.playerId, damage: Math.floor(enemy.attack * 0.7) });
        break;
      case 'nat1':
        totalEnemyDamage += 0;
        playerDamages.push({ playerId: action.playerId, damage: enemy.attack }); // 풀 데미지
        break;
    }
  }

  // 적 방어력 적용
  totalEnemyDamage = Math.max(0, totalEnemyDamage - enemy.defense);

  return {
    enemyDamage: totalEnemyDamage,
    playerDamages,
    enemyDefeated: totalEnemyDamage >= enemy.hp,
    loot: [], // 적 처치 시 별도 생성
  };
}
```

---

## 주사위 보정 계산

```typescript
function calculateBonus(character: Character, actionCategory: ActionCategory): number {
  let bonus = 0;

  // 캐릭터 배경 보정
  const backgroundBonusMap: Record<string, ActionCategory[]> = {
    '전직 경비원': ['physical', 'defensive'],
    '요리사': ['creative'],
    '개발자': ['technical'],
    '영업사원': ['social'],
  };
  if (backgroundBonusMap[character.background]?.includes(actionCategory)) {
    bonus += 2;
  }

  // 장비 보정
  if (actionCategory === 'physical') bonus += character.equipment.weaponBonus;
  if (actionCategory === 'defensive') bonus += character.equipment.armorBonus;

  return bonus;
}

function determineTier(roll: number, effectiveRoll: number, dc: number): RollTier {
  if (roll === 1) return 'nat1';
  if (roll === 20) return 'nat20';
  if (effectiveRoll < dc) return 'fail';
  if (effectiveRoll >= dc + 5) return 'critical';
  return 'normal';
}
```

---

## 파일 구조

```
our-lore/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Lobby/
│   │   │   │   ├── LobbyScreen.tsx        # 방 생성/참가
│   │   │   │   └── CharacterSetup.tsx     # 캐릭터 이름/배경 선택
│   │   │   ├── Battle/
│   │   │   │   ├── BattleScreen.tsx       # 메인 전투 화면 (phase에 따라 하위 컴포넌트 전환)
│   │   │   │   ├── SituationDisplay.tsx   # LLM 상황 묘사 표시
│   │   │   │   ├── ChoiceCards.tsx        # 내 선택지 2~3개 카드 표시
│   │   │   │   ├── DiceRoll.tsx           # 주사위 굴림 UI + 애니메이션
│   │   │   │   ├── RollResults.tsx        # 4명 주사위 결과 동시 공개
│   │   │   │   ├── NarrationBox.tsx       # LLM 결과 서술 표시
│   │   │   │   ├── PartyStatus.tsx        # 4명 HP 바
│   │   │   │   └── WaveEndChoice.tsx      # 계속/철수 버튼
│   │   │   ├── Result/
│   │   │   │   └── RunResult.tsx          # 런 종료 결과 화면
│   │   │   └── common/
│   │   │       ├── EarthboundBg.tsx       # 사이키델릭 배경 패턴
│   │   │       └── Timer.tsx              # 카운트다운 타이머
│   │   ├── hooks/
│   │   │   ├── useSocket.ts
│   │   │   └── useGameState.ts
│   │   ├── stores/
│   │   │   └── gameStore.ts               # Zustand - RunState, RunPhase 관리
│   │   ├── styles/
│   │   │   └── theme.ts                   # EarthBound 컬러 팔레트
│   │   └── App.tsx
│   └── package.json
├── server/
│   ├── src/
│   │   ├── game/
│   │   │   ├── Room.ts                    # 방 관리
│   │   │   ├── WaveManager.ts             # 웨이브 진행 상태 머신
│   │   │   ├── DiceEngine.ts              # d20 난수 + 보정 + tier 판정
│   │   │   └── DamageCalculator.ts        # 데미지 공식
│   │   ├── ai/
│   │   │   ├── prompts.ts                 # LLM 프롬프트 템플릿
│   │   │   ├── situationGenerator.ts      # 프롬프트 1: 상황 + 선택지
│   │   │   └── narrativeGenerator.ts      # 프롬프트 2: 결과 서술
│   │   ├── socket/
│   │   │   ├── handlers.ts                # 소켓 이벤트 핸들러
│   │   │   └── events.ts                  # 이벤트 이름 상수
│   │   └── index.ts
│   └── package.json
├── shared/
│   └── types.ts                           # 위에 정의한 모든 타입
└── CLAUDE.md
```

---

## 구현 순서 (중요: 이 순서를 반드시 따를 것)

### Phase 1: 프로젝트 셋업 + 로비
1. Vite + React + TypeScript 클라이언트 초기화
2. Express + Socket.io 서버 초기화
3. shared/types.ts 배치
4. 방 생성/참가 로직 (4자리 코드)
5. 로비 UI (방 코드 표시, 참가자 목록, 시작 버튼)
6. 캐릭터 설정 UI (이름 입력, 배경 4개 중 선택, 특성/약점 자동 배정)

### Phase 2: 전투 코어 루프 (LLM 없이)
7. WaveManager 상태 머신 구현 (phase 전환)
8. **하드코딩된 상황/선택지/적으로 전체 흐름 테스트** ← 이게 핵심
9. ChoiceCards UI (2~3개 카드, 탭으로 선택, 타이머)
10. DiceRoll UI (탭하면 1~20 랜덤 + 간단한 숫자 애니메이션)
11. RollResults UI (4명 결과 동시 표시, tier별 색상 구분)
12. DamageCalculator 로직
13. NarrationBox UI (하드코딩된 텍스트 표시)
14. WaveEndChoice UI (계속/철수)
15. PartyStatus UI (HP 바 4개)

### Phase 3: LLM 연동
16. Claude API 연동 (서버 사이드)
17. situationGenerator 구현 (프롬프트 1)
18. narrativeGenerator 구현 (프롬프트 2)
19. 하드코딩 데이터를 LLM 생성 데이터로 교체
20. 에러 핸들링 (LLM 실패 시 폴백 데이터)

### Phase 4: 게임 완성
21. 런 종료 처리 (철수/전멸/클리어)
22. RunResult 화면
23. 밸런싱 (데미지 수치, DC 범위, 웨이브 수)
24. 모바일 터치 최적화 (아이폰 사파리)
25. 배포 (Vercel + Railway)

---

## 주의사항

- Phase 2를 LLM 없이 먼저 완성하라. 하드코딩된 3~4개 상황/선택지 세트로 전체 흐름이 돌아가는 것을 확인한 후에 LLM을 연동하라.
- 주사위 난수는 반드시 서버에서 생성하라 (치트 방지). 클라이언트는 애니메이션만 재생.
- LLM 프롬프트는 반드시 JSON 응답을 요구하고, 파싱 실패 시 재시도 1회 + 폴백 데이터 사용.
- 선택지 제한시간 10초 초과 시 랜덤 선택 자동 배정.
- 주사위 굴림 제한시간 5초 초과 시 자동 굴림.
- EarthBound 톤: 현대적 소재를 기묘하게, 진지한 상황을 유머러스하게, 감성적이되 과하지 않게.
- 아이폰 사파리 세로 화면 기준으로 UI 설계. 한 손 엄지 조작.
- Zustand로 클라이언트 상태 관리. Redux 사용 금지.
- CSS는 Tailwind 또는 styled-components. 인라인 스타일 금지.
- 소켓 이벤트 이름은 kebab-case (wave-intro, player-choice 등).

---

## CLAUDE.md 내용

이 파일의 내용을 프로젝트 루트의 CLAUDE.md로도 사용하라. 단, CLAUDE.md에는 "구현 순서" 섹션의 체크리스트를 `- [ ]` 형식으로 넣어서 진행 상태를 추적할 수 있게 하라.
