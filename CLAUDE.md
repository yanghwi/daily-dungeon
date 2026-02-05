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
웨이브 시작
  → LLM이 상황 묘사 + 4명 각자에게 서로 다른 선택지 생성
  → 4명 동시에 선택지 고름 (10초)
  → 4명 동시에 d20 주사위 굴림
  → LLM이 "4명의 선택 + 4개의 주사위" 조합으로 전투 서술
  → 데미지 계산 → 계속/철수 투표
  → 다음 웨이브 또는 런 종료
```

## RunPhase 상태 머신

```
waiting → character_setup → wave_intro → choosing → rolling → narrating → wave_result → run_end
                                ↑                                    │
                                └────────────────────────────────────┘ (다음 웨이브)
```

| Phase | 설명 | UI |
|-------|------|----|
| `waiting` | 로비 대기 | LobbyScreen (home/room) |
| `character_setup` | 캐릭터 이름/배경 선택 | CharacterSetup |
| `wave_intro` | LLM이 상황 + 선택지 생성 중 | (Phase 2에서 구현) |
| `choosing` | 4명이 선택지 고르는 중 | ChoiceCards |
| `rolling` | 4명이 주사위 굴리는 중 | DiceRoll |
| `narrating` | LLM이 결과 서술 중 | NarrationBox |
| `wave_result` | 결과 표시 + 계속/철수 선택 | WaveEndChoice |
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
| DC+5 이상 | `critical` | 강력한 성공, 2배 데미지 |
| DC 이상 | `normal` | 보통 성공 |
| DC 미만 | `fail` | 실패, 약간의 피해 |
| 1 (nat1) | `nat1` | 항상 실패, 풀 데미지 |

## 폴더 구조

```
round-midnight/
├── client/                         # @round-midnight/client
│   ├── src/
│   │   ├── components/
│   │   │   └── Lobby/
│   │   │       ├── LobbyScreen.tsx    # 홈(방 생성/참가) + 대기실
│   │   │       └── CharacterSetup.tsx # 캐릭터 이름/배경 선택
│   │   ├── hooks/
│   │   │   └── useSocket.ts           # Socket.io 이벤트 리스너/에미터
│   │   ├── stores/
│   │   │   └── gameStore.ts           # Zustand (RunPhase 기반 라우팅)
│   │   ├── styles/
│   │   │   └── theme.ts              # tierColors, BACKGROUNDS 데이터
│   │   ├── index.css                  # Tailwind 디렉티브
│   │   ├── App.tsx                    # RunPhase 기반 라우팅
│   │   └── main.tsx
│   ├── tailwind.config.js             # 커스텀 테마 (midnight, arcane, tier)
│   └── postcss.config.js
├── server/                         # @round-midnight/server
│   └── src/
│       ├── game/
│       │   ├── Room.ts                # RoomManager (phase 상태 머신)
│       │   └── Player.ts             # createCharacter + applyBackground
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

### 전투 (Phase 2에서 구현)
| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `wave-intro` | S→C | 상황 묘사 + 선택지 |
| `player-choice` | C→S | 선택지 선택 |
| `all-choices-ready` | S→C | 전원 선택 완료 |
| `dice-roll` | C→S | 주사위 굴리기 탭 |
| `roll-results` | S→C | 4명 주사위 결과 |
| `wave-narrative` | S→C | LLM 결과 서술 |
| `wave-end` | S→C | 결과 + 계속/철수 |
| `continue-or-retreat` | C→S | 계속 or 철수 |
| `run-end` | S→C | 런 종료 결과 |

## 스타일링 규칙

### Tailwind CSS 사용
- 커스텀 테마: `tailwind.config.js`에 정의
- 색상 그룹: `midnight-*` (배경), `arcane-*` (보라색 포인트), `tier-*` (주사위 결과), `gold`
- 커스텀 애니메이션: `dice-spin`, `slide-up`, `fade-in`, `pulse-glow`
- 폰트: Noto Sans KR

### 참고 파일
- Tailwind 테마: `client/tailwind.config.js`
- 게임 데이터 (배경/티어): `client/src/styles/theme.ts`
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
- Phase 2는 하드코딩 데이터로 전체 흐름 확인 후 LLM 연동

### 플랫폼 제약
- 아이폰 사파리 세로 화면
- 한 손 엄지 조작
- 10분 내 완료

## 구현 진행 상황

- [x] **Phase 1**: 프로젝트 셋업 + 로비 + 캐릭터 설정
  - shared/types.ts 전면 교체 (Character, Equipment, RunPhase, SOCKET_EVENTS 등)
  - 패키지명 @round-midnight/* 로 변경
  - Tailwind CSS 도입 + 커스텀 테마
  - 서버: RoomManager (phase 상태 머신), Player (createCharacter + applyBackground)
  - 클라이언트: Zustand store, useSocket, LobbyScreen, CharacterSetup
- [ ] **Phase 2**: 전투 코어 루프 (LLM 없이 하드코딩 데이터로)
- [ ] **Phase 3**: LLM 연동
- [ ] **Phase 4**: 게임 완성 + 모바일 최적화 + 배포

## 문서

- [docs/GAME-DESIGN.md](docs/GAME-DESIGN.md) - 게임 설계서 (타입 정의, LLM 프롬프트, 데미지 공식, 구현 순서)
- [docs/design-system/](docs/design-system/) - Mother/Earthbound 디자인 시스템
