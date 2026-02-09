# Architecture - Round Midnight

## 기술 스택

- **프론트엔드**: React + TypeScript + Tailwind CSS + Zustand
- **백엔드**: Node.js + Express + Socket.io
- **AI**: Claude API (선택지 생성 + 전투 판정 + 내러티브)
- **DB**: Prisma + PostgreSQL (Railway)
- **배포**: Railway (클라이언트 + 서버), Dockerfile 멀티스테이지 빌드

## 폴더 구조

```
round-midnight/
├── client/                         # @round-midnight/client
│   ├── src/
│   │   ├── assets/
│   │   │   ├── backgrounds/           # 전투 배경 (CSS gradient 레이어)
│   │   │   ├── effects/               # 전투 이펙트 (히트/미스/크리)
│   │   │   ├── sprites/               # 적 스프라이트 (box-shadow 픽셀아트)
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── Battle/
│   │   │   │   ├── BattleBg.tsx       # 전투 배경 컨테이너
│   │   │   │   ├── BattleScreen.tsx   # 전투 메인 (phase 라우팅)
│   │   │   │   ├── ChoiceCards.tsx     # 선택지 카드 UI
│   │   │   │   ├── DiceRoll.tsx       # 주사위 굴리기 (탭 인터랙션)
│   │   │   │   ├── NarrationBox.tsx   # LLM 내러티브 표시
│   │   │   │   ├── PartyStatus.tsx    # 파티 HP 바
│   │   │   │   ├── SituationBox.tsx   # 상황 묘사 타이프라이터
│   │   │   │   ├── MaintenanceScreen.tsx # 정비 세션 (장비 관리 + 투표)
│   │   │   │   ├── RollResults.tsx    # 4인 주사위 결과 그리드
│   │   │   │   ├── RunResult.tsx      # 런 종료 화면
│   │   │   │   └── WaveEndChoice.tsx  # 전리품 표시 (3초)
│   │   │   ├── Hub/
│   │   │   │   ├── CharacterHub.tsx    # 메인 허브 (캐릭터 설정 + 게임 시작)
│   │   │   │   ├── LoginScreen.tsx     # 로그인 화면
│   │   │   │   └── UnlockPanel.tsx     # 해금 목록 UI (14종 진행도)
│   │   │   ├── RoomCodeBadge.tsx   # 방 코드 상시 배지 (탭→클립보드 복사)
│   │   │   └── Lobby/
│   │   │       ├── LobbyScreen.tsx    # 홈(방 생성/참가) + 대기실 + 캐릭터 패널
│   │   │       ├── LobbyBg.tsx        # 로비 배경
│   │   │       └── CharacterSetup.tsx # 캐릭터 이름/배경 선택
│   │   ├── hooks/
│   │   │   └── useSocket.ts           # Socket.io 이벤트 리스너/에미터
│   │   ├── stores/
│   │   │   └── gameStore.ts           # Zustand (RunPhase 기반 라우팅)
│   │   ├── styles/
│   │   │   └── theme.ts              # BACKGROUNDS 데이터
│   │   ├── index.css                  # Tailwind + 디자인 토큰 + 가로모드 차단
│   │   ├── App.tsx                    # RunPhase 기반 라우팅
│   │   └── main.tsx
│   ├── tailwind.config.js             # 커스텀 테마 (midnight, arcane, tier, xs breakpoint)
│   └── postcss.config.js
├── server/                         # @round-midnight/server
│   ├── prisma/
│   │   └── schema.prisma            # Prisma 스키마 (User, RunResult, DailySeed 등)
│   ├── prisma.config.ts              # Prisma 설정 (DATABASE_URL)
│   └── src/
│       ├── ai/
│       │   ├── client.ts             # Anthropic API 클라이언트 (폴백 지원)
│       │   ├── highlightsGenerator.ts # 런 하이라이트 생성
│       │   ├── narrativeGenerator.ts  # 전투 내러티브 생성
│       │   ├── prompts.ts            # LLM 시스템 프롬프트
│       │   └── situationGenerator.ts  # 상황/선택지 생성
│       ├── api/
│       │   └── routes.ts             # REST API (인증, 런 히스토리, 데일리, 해금)
│       ├── auth/
│       │   ├── jwt.ts                # JWT 발급/검증/미들웨어
│       │   └── discord.ts            # Discord OAuth2 플로우
│       ├── db/
│       │   ├── client.ts             # Prisma 클라이언트 싱글턴
│       │   └── runSaver.ts           # 런 결과 DB 저장 + 해금 체크
│       ├── game/
│       │   ├── data/
│       │   │   ├── hardcodedData.ts   # LLM 폴백 하드코딩 데이터
│       │   │   └── items/             # 아이템 카탈로그 (106종)
│       │   │       ├── index.ts       # getItemById, getAllItems
│       │   │       ├── weapons.ts     # 무기 30종
│       │   │       ├── tops.ts        # 상의 15종
│       │   │       ├── bottoms.ts     # 하의 8종
│       │   │       ├── hats.ts        # 모자 8종
│       │   │       ├── accessories.ts # 악세서리 25종
│       │   │       └── consumables.ts # 소모품 20종
│       │   ├── progression/
│       │   │   ├── unlockables.ts     # 해금 가능 항목 정의 (14종, 패시브/칭호/배경/코스메틱)
│       │   │   └── unlockChecker.ts   # 해금 조건 체크 + DB 저장 + getUnlockedPassives
│       │   ├── DailyDungeon.ts        # Seeded PRNG + 데일리 시드 관리
│       │   ├── DamageCalculator.ts    # 데미지 계산 엔진
│       │   ├── DiceEngine.ts          # d20 주사위 + 보정 계산
│       │   ├── InventoryManager.ts    # 장착/해제/사용/버리기 + 20칸 제한
│       │   ├── ItemEffectResolver.ts  # 장착 효과 + 임시 버프 + 시너지 + 레벨DC + 패시브 집계
│       │   ├── SynergyResolver.ts    # 태그 시너지 6종 정의 + 해석
│       │   ├── LootEngine.ts          # 가중 랜덤 드랍 생성 (시드 PRNG 지원)
│       │   ├── Player.ts             # createCharacter + applyBackground + getUserLevel
│       │   ├── Room.ts               # RoomManager (phase 상태 머신, mode 지원)
│       │   └── WaveManager.ts        # 웨이브 진행 관리 + 런 결과 DB 저장
│       ├── socket/
│       │   └── handlers.ts           # 소켓 이벤트 핸들러
│       └── index.ts
├── shared/                         # @round-midnight/shared
│   └── types.ts                       # 모든 타입 + GAME_CONSTANTS + SOCKET_EVENTS
├── docs/
│   ├── GAME-DESIGN.md                 # 게임 설계서 (타입, 코어 루프, 데미지 공식)
│   ├── ARCHITECTURE.md                # 기술 스택, 폴더 구조, Socket 이벤트 (이 파일)
│   ├── DEV-GUIDE.md                   # 개발 주의사항, 시스템별 상세 규칙
│   ├── PROGRESS.md                    # 구현 진행 상황
│   └── design-system/
│       ├── STYLE-GUIDE.md             # Mother/Earthbound 디자인 시스템
│       ├── assets/                    # HTML 에셋 (earthbound-assets, poster)
│       └── references/                # 토큰, UI 컴포넌트, 픽셀아트, 배경
├── Dockerfile                         # 멀티스테이지 빌드 (Railway 배포)
└── CLAUDE.md
```

## Socket 이벤트

모든 이벤트 이름은 `shared/types.ts`의 `SOCKET_EVENTS` 상수로 관리.

### 로비
| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `create-room` | C→S | 방 생성 |
| `join-room` | C→S | 방 참가 |
| `leave-room` | C→S | 방 퇴장 |
| `room-created` | S→C | 방 생성 완료 |
| `room-joined` | S→C | 방 참가 완료 |
| `player-joined` | S→C | 새 플레이어 입장 |
| `player-left` | S→C | 플레이어 퇴장 |

### 캐릭터 설정
| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `start-game` | C→S | 호스트가 게임 시작 → character_setup 진입 |
| `game-started` | S→C | character_setup phase 알림 |
| `character-setup` | C→S | 이름/배경 제출 |
| `character-ready` | S→C | 캐릭터 설정 완료 알림 |
| `all-characters-ready` | S→C | 전원 설정 완료 → wave_intro 진입 |

### 전투
| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `wave-intro` | S→C | 상황 묘사 + 선택지 |
| `player-choice` | C→S | 선택지 선택 |
| `all-choices-ready` | S→C | 전원 선택 완료 |
| `dice-roll` | C→S | 주사위 굴리기 탭 |
| `roll-results` | S→C | 4명 주사위 결과 |
| `wave-narrative` | S→C | LLM 결과 서술 + partyStatus + enemyHp |
| `wave-end` | S→C | 전리품 표시 (적 사망 시) |
| `combat-choices` | S→C | 적 생존 시 다음 라운드 선택지 |
| `maintenance-start` | S→C | 정비 세션 시작 (장비 관리 + 투표) |
| `vote-update` | S→C | 투표 현황 (continueCount, retreatCount, total) |
| `continue-or-retreat` | C→S | 계속 or 철수 (maintenance phase) |
| `run-end` | S→C | 런 종료 결과 |

### 아이템/인벤토리
| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `equip-item` | C→S | 아이템 장착 |
| `unequip-item` | C→S | 아이템 해제 |
| `use-consumable` | C→S | 소모품 사용 |
| `discard-item` | C→S | 아이템 버리기 |
| `inventory-updated` | S→C | 인벤토리/장비/버프 변경 알림 |

## RunPhase 상태 머신

```
waiting → character_setup → wave_intro → choosing → rolling → narrating
                                ↑            ↑                    │
                                │            └────────────────────┘ (적 생존: 선택지만 재생성)
                                │                                 │ (적 사망)
                                │                            wave_result (전리품 표시, 3초)
                                │                                 ↓
                                │                            maintenance (장비 관리 + 투표)
                                │                                 │
                                └─────────────────────────────────┘ (계속 → 다음 웨이브)
                                                                  ↓
                                                               run_end
```

| Phase | 설명 | UI |
|-------|------|----|
| `waiting` | 로비 대기 | LobbyScreen (home/room) |
| `character_setup` | 캐릭터 이름/배경 선택 | CharacterSetup |
| `wave_intro` | LLM이 상황 + 선택지 생성 중 | BattleScreen (로딩) |
| `choosing` | 4명이 선택지 고르는 중 | ChoiceCards |
| `rolling` | 4명이 주사위 굴리는 중 | DiceRoll |
| `narrating` | LLM이 결과 서술 중 | NarrationBox |
| `wave_result` | 전리품 표시 (3초) | WaveEndChoice |
| `maintenance` | 장비 관리 + 계속/철수 투표 | MaintenanceScreen |
| `run_end` | 런 종료 (철수/전멸/클리어) | RunResult |

## 스타일링 규칙

### Tailwind CSS
- 커스텀 테마: `tailwind.config.js`에 정의
- 색상 그룹: `midnight-*` (배경), `arcane-*` (보라색 포인트), `tier-*` (주사위 결과), `gold`
- 커스텀 애니메이션: `dice-spin`, `slide-up`, `fade-in`, `pulse-glow`
- 폰트: Press Start 2P (제목) + Silkscreen (본문) + Noto Sans KR (기본)

### 참고 파일
- Tailwind 테마: `client/tailwind.config.js`
- 디자인 토큰 (CSS 변수): `client/src/index.css` `:root`
- 게임 데이터 (배경): `client/src/styles/theme.ts`
- 패턴 예시: `client/src/components/Lobby/LobbyScreen.tsx`

### 디자인 시스템 (필수 참조)
모든 UI, 에셋, 디자인 작업 시 반드시 `docs/design-system/`을 참조할 것.

- **총괄**: `docs/design-system/STYLE-GUIDE.md`
- **토큰**: `docs/design-system/references/tokens.md`
- **UI**: `docs/design-system/references/ui-components.md`
- **스프라이트**: `docs/design-system/references/pixel-art.md`
- **배경**: `docs/design-system/references/backgrounds.md`
- **에셋**: `docs/design-system/assets/`

### 코드 예시
```tsx
// ✅ Tailwind 클래스 사용
className="flex items-center bg-midnight-700 text-white"
className="bg-arcane text-arcane-light border-tier-nat20"

// ❌ 하드코딩 색상 / 인라인 스타일
backgroundColor: '#1a1a2e'
style={{ color: 'red' }}
```

## Prisma + Railway PostgreSQL

- **로컬 개발**: Railway public proxy URL (`*.proxy.rlwy.net`) 사용
- **프로덕션**: Railway internal URL (`*.railway.internal`) 사용
- **마이그레이션**: `cd server && npx prisma migrate dev --name <name>`
- **Windows DLL 잠금**: 서버 실행 중 `prisma generate` 실패 → 서버 종료 후 실행
- **`.env` 변경 후**: `tsx watch`는 `.env`를 감지하지 않으므로 서버 수동 재시작 필요
