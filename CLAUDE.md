# CLAUDE.md - Round Midnight

## 한 줄 요약

4인 협동 웹 로그라이트. EarthBound 톤 + D&D식 선택지 + d20 주사위. 아이폰 사파리, 침대에서 15분.

## 핵심 철학

- 10분 안에 끝나야 함
- 복잡한 조작 없음 (한 손 엄지 조작)
- 선택이 방향을 정하고, 주사위가 강도를 정한다
- 하루 한 번의 설렘

## 기술 스택

- **프론트엔드**: React + TypeScript + Tailwind CSS + Zustand
- **백엔드**: Node.js + Express + Socket.io
- **AI**: Claude API (선택지 생성 + 전투 판정 + 내러티브)
- **배포**: Vercel + Railway

## 코어 루프

```
웨이브 시작 (새 적 조우)
  → LLM이 상황 묘사 + 4명 각자에게 서로 다른 선택지 생성
  → 전투 라운드 루프:
    → 4명 동시에 선택지 고름 (10초)
    → 4명 동시에 d20 주사위 굴림
    → LLM이 "4명의 선택 + 4개의 주사위" 조합으로 전투 서술
    → 적 생존 시: 선택지만 재생성 → 루프 반복
    → 적 사망 시: 전리품 표시 (3초) → 정비 세션
  → 정비 세션: 장비 관리 + 계속/철수 투표 (45초)
  → 다음 웨이브 또는 런 종료
```

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

## 캐릭터 시스템

| 배경 | 특성 | 약점 | 보정 |
|------|------|------|------|
| 전직 경비원 | 용감한 | 어둠을 무서워함 | physical/defensive +2 |
| 요리사 | 호기심 많은 | 거미 공포증 | creative +2 |
| 개발자 | 겁 많은 | 사회적 상황에 약함 | technical +2 |
| 영업사원 | 말빨 좋은 | 체력이 약함 | social +2 |

## 주사위 시스템 (d20)

| d20 결과 | RollTier | 설명 |
|----------|----------|------|
| 20 (nat20) | `nat20` | 항상 성공, 적에게 3배 데미지 |
| DC+critMin 이상 | `critical` | 강력한 성공, 2배 데미지 (기본 critMin=5, crit_expand 효과로 감소) |
| DC 이상 | `normal` | 보통 성공 |
| DC 미만 | `fail` | 실패, 약간의 피해 |
| 1 (nat1) | `nat1` | 항상 실패, 풀 데미지 |

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
│   └── src/
│       ├── ai/
│       │   ├── client.ts             # Anthropic API 클라이언트 (폴백 지원)
│       │   ├── highlightsGenerator.ts # 런 하이라이트 생성
│       │   ├── narrativeGenerator.ts  # 전투 내러티브 생성
│       │   ├── prompts.ts            # LLM 시스템 프롬프트
│       │   └── situationGenerator.ts  # 상황/선택지 생성
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
│       │   ├── DamageCalculator.ts    # 데미지 계산 엔진
│       │   ├── DiceEngine.ts          # d20 주사위 + 보정 계산
│       │   ├── InventoryManager.ts    # 장착/해제/사용/버리기 + 20칸 제한
│       │   ├── ItemEffectResolver.ts  # 장착 효과 + 임시 버프 집계
│       │   ├── LootEngine.ts          # 가중 랜덤 드랍 생성
│       │   ├── Player.ts             # createCharacter + applyBackground
│       │   ├── Room.ts               # RoomManager (phase 상태 머신)
│       │   └── WaveManager.ts        # 웨이브 진행 관리
│       ├── socket/
│       │   └── handlers.ts           # 소켓 이벤트 핸들러
│       └── index.ts
├── shared/                         # @round-midnight/shared
│   └── types.ts                       # 모든 타입 + GAME_CONSTANTS + SOCKET_EVENTS
├── docs/
│   ├── GAME-DESIGN.md                 # 게임 설계서 (타입, 코어 루프, 데미지 공식)
│   └── design-system/
│       ├── STYLE-GUIDE.md             # Mother/Earthbound 디자인 시스템
│       ├── assets/                    # HTML 에셋 (earthbound-assets, poster)
│       └── references/                # 토큰, UI 컴포넌트, 픽셀아트, 배경
├── vercel.json                        # Vercel 배포 설정 (SPA 리라이트)
├── Dockerfile                         # 멀티스테이지 빌드 (서버)
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

## 스타일링 규칙

### Tailwind CSS 사용
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

- **총괄**: `docs/design-system/STYLE-GUIDE.md` — 미적 방향, 핵심 기법
- **토큰**: `docs/design-system/references/tokens.md` — CSS 변수 (색상, 간격, 폰트)
- **UI**: `docs/design-system/references/ui-components.md` — 윈도우, HP바, 메뉴
- **스프라이트**: `docs/design-system/references/pixel-art.md` — box-shadow 픽셀아트
- **배경**: `docs/design-system/references/backgrounds.md` — 사이키델릭 레이어 조합
- **에셋**: `docs/design-system/assets/` — 참조 HTML (몬스터, 포스터)

핵심 원칙:
- 폰트: Press Start 2P (제목) + Silkscreen (본문)
- 스프라이트: box-shadow 4px 그리드
- 배경: CSS gradient 레이어 조합 (사이키델릭)
- 애니메이션: steps(N) 레트로 느낌

### 규칙
```tsx
// ✅ Tailwind 클래스 사용
className="flex items-center bg-midnight-700 text-white"

// ✅ 테마 색상 참조
className="bg-arcane text-arcane-light border-tier-nat20"

// ❌ 하드코딩 색상
backgroundColor: '#1a1a2e'

// ❌ 인라인 스타일
style={{ color: 'red' }}
```

## 개발 주의사항

### 빌드 검증
```bash
# ❌ 전체 빌드 (shared에 build 스크립트 없어서 실패)
npm run build

# ✅ 개별 워크스페이스 빌드
npm run build --workspace=@round-midnight/client
npm run build --workspace=@round-midnight/server
```

### Socket 이벤트 추가 시
1. `shared/types.ts`에 페이로드 타입 정의
2. `shared/types.ts`의 `SOCKET_EVENTS`에 이벤트 이름 추가
3. `server/src/socket/handlers.ts`에 핸들러 추가
4. `client/src/hooks/useSocket.ts`에 리스너 추가
5. `client/src/stores/gameStore.ts`에 상태 추가

### LLM 의존 시스템 설계
- 반드시 폴백 로직 구현 (API 키 없을 때, API 실패 시)
- 하드코딩 폴백: `server/src/game/data/hardcodedData.ts`

### 코드 작성 규칙 (Phase A 교훈)
- **Props/함수를 만들면 반드시 연결할 것**: props를 컴포넌트에 추가하면 호출하는 쪽에서도 전달해야 함. "나중에 쓸 거니까 미리 만들어두자"는 dead code를 만듦
- **중복 데이터 소스 금지**: 같은 로직을 함수(`getWaveBackground()`)와 Record(`WAVE_BACKGROUNDS`)로 이중 구현하지 말 것. 하나만 유지
- **새 파일 import 확인**: 기존 코드가 존재하지 않는 모듈을 import하고 있을 수 있음 (예: `logger.ts` 누락). 빌드 검증 필수
- **배경 데이터**: `getWaveBackground(waveNumber, isBoss, bossType)`으로 배경 선택. `client/src/assets/backgrounds/backgroundData.ts`

### 아이템 효과 시스템
- **단일 진실 소스**: 장비 보너스는 `ItemEffectResolver.resolveEquippedEffects()`가 집계한 `ResolvedEffects`를 사용. `character.equipment.weaponBonus`를 직접 읽지 말 것
- **DiceEngine.calculateBonus(character, category, resolved?)**: `resolved`가 있으면 집계된 보너스 사용, 없으면 기존 character.equipment에서 직접 읽기 (하위 호환)
- **소모품 임시 버프**: `useConsumable()` → `activeBuffs`에 `remainingWaves: 1`로 추가 → `resolveEquippedEffects()`에서 집계 → 웨이브 종료 시 `expireBuffs()`로 만료
- **인벤토리 제한**: `GAME_CONSTANTS.MAX_RUN_INVENTORY = 20`, 초과 시 `addItemToInventory()` 원래 객체 반환, `LootItem.inventoryFull` 플래그로 UI 알림

### 플랫폼 제약
- 아이폰 사파리 세로 화면
- 한 손 엄지 조작
- 10분 내 완료

## 구현 진행 상황

- [x] **Phase 1**: 프로젝트 셋업 + 로비 + 캐릭터 설정
- [x] **Phase 2**: 전투 코어 루프 (하드코딩 데이터)
- [x] **Phase 3**: LLM 연동 (상황/선택지/내러티브/하이라이트)
- [x] **Phase 4**: 배포 + 모바일 최적화
  - Vercel SPA 리라이트, Dockerfile 멀티스테이지 빌드
  - Vite chunk splitting, 반응형 폰트, 가로 모드 차단
  - 디자인 토큰 CSS 변수, OG 메타 태그
- [x] **Phase 5**: 전투 화면 가독성 + UX 개선
  - 폰트 사이즈 전면 확대 (레트로 픽셀 폰트 가독성)
  - SituationBox 타이프라이터 연출 (한 글자씩 출력 + 탭 스킵)
  - 체력 실시간 반영 (WAVE_NARRATIVE에서 즉시 HP 갱신)
- [x] **Phase A**: 기반 정비
  - 장비 효과 구현 (reroll, crit_expand)
  - 재접속 핸들러 (playerId 기반 socketId 교체)
  - 투표 현황 실시간 표시 (VOTE_UPDATE 이벤트)
  - 몬스터 스프라이트 확대 (scale 3→5~6, 보스 7+)
  - 스테이지 배경 시스템 개편 (통일 배경 + 보스 전용 배경)
- [x] **Phase B**: 아이템 시스템 + 루트 메카닉 (106종 아이템 카탈로그)
  - 5슬롯 장비 (weapon/top/bottom/hat/accessory) + 소모품
  - ItemEffectResolver → ResolvedEffects 집계 (장비 + 임시 버프)
  - 인벤토리 20칸 제한 + 아이템 버리기 (DISCARD_ITEM)
  - 소모품 임시 버프 (TemporaryBuff, 웨이브 종료 시 만료)
  - LootEngine 가중 랜덤 드랍 + 웨이브/보스 보정
- [x] **Phase B-feedback**: 전투 흐름 개편 + UX 개선
  - 멀티라운드 전투 (적 생존 시 선택지만 재생성, 상황 묘사 생략)
  - 정비 세션 분리 (wave_result → 전리품 3초 → maintenance → 장비 관리 + 투표)
  - 스프라이트 센터링 보정 (visualWidth/Height + translate 오프셋)
  - HP 밸런스 (플레이어 100→60, 적 스탯 비례 하향)
  - 배경 톤 다운 (opacity/speed 대폭 감소)
  - 로비 캐릭터 패널 (인벤토리/장비 조회)
  - 적 사망 시 즉시 스프라이트 소멸
- [x] **Phase C**: 보스 몬스터 시스템 (Wave 6~10 적 + 최종보스 + 보스 드랍 + 스프라이트)
  - Wave 6~9 일반 적 4종 (배달 오토바이, 마네킹, 네온사인 요괴, 안테나)
  - Wave 10 최종보스 "자정의 시계" (HP 150, ATK 25, DEF 12)
  - 5종 box-shadow 스프라이트 + 5종 idle 애니메이션
  - 보스 드랍 보장 (중보스: rare+, 최종보스: legendary+, 보너스 드랍)
  - 보스 UI (BOSS/FINAL BOSS 표시, 보스 예고 텔레그래핑)
  - NEXT_WAVE_PREVIEWS 10웨이브 전체 확장
- [ ] **Phase D**: DB + 영속성 (Prisma + PostgreSQL)
- [ ] **Phase E**: Discord OAuth2 인증
- [ ] **Phase F**: 캐릭터 생성 리뉴얼 (픽셀아트 조합)

## 문서

- [docs/GAME-DESIGN.md](docs/GAME-DESIGN.md) - 게임 설계서 (타입 정의, LLM 프롬프트, 데미지 공식, 구현 순서)
- [docs/design-system/](docs/design-system/) - Mother/Earthbound 디자인 시스템
