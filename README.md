![Round Midnight](./poster.gif)

# Round Midnight

> 자정이 지나면, 이상한 일이 시작된다.

4인 협동 웹 로그라이트.
모바일 웹 브라우저로, 침대에서 자기 전에 15분.

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

**핵심:** 선택이 방향을 정하고, 주사위가 강도를 정한다.

## 캐릭터

| 배경 | 특성 | 약점 | 보정 |
|------|------|------|------|
| 🛡️ 전직 경비원 | 용감한 | 어둠을 무서워함 | 물리/방어 +2/+1 |
| 🍳 요리사 | 호기심 많은 | 거미 공포증 | 창의 행동 보정 |
| 💻 개발자 | 겁 많은 | 사회적 상황에 약함 | 기술 행동 보정 |
| 💼 영업사원 | 말빨 좋은 | 체력이 약함 | 사회 행동 보정 |

## 주사위 시스템

| d20 결과 | 판정 | 설명 |
|----------|------|------|
| 20 (nat20) | 영웅적 순간 | 항상 성공, 적에게 3배 데미지 |
| DC+5 이상 | 크리티컬 | 강력한 성공, 2배 데미지 |
| DC 이상 | 성공 | 보통 성공 |
| DC 미만 | 실패 | 실패, 약간의 피해 |
| 1 (nat1) | 황당한 재앙 | 항상 실패, 풀 데미지 |

## 기술 스택

- **Frontend**: React + TypeScript + Tailwind CSS + Zustand
- **Backend**: Node.js + Express + Socket.io
- **AI**: Claude API (선택지 생성 + 전투 판정 + 내러티브)
- **Deploy**: Vercel + Railway

## 로컬 실행

```bash
npm install
npm run dev
```

개별 빌드:
```bash
npm run build --workspace=@round-midnight/client
npm run build --workspace=@round-midnight/server
```

## 환경 변수

```bash
# server/.env
ANTHROPIC_API_KEY=your_api_key
```

## 프로젝트 구조

```
round-midnight/
├── client/
│   └── src/
│       ├── components/
│       │   └── Lobby/          # LobbyScreen, CharacterSetup
│       ├── hooks/useSocket.ts
│       ├── stores/gameStore.ts # Zustand (RunPhase 기반)
│       └── styles/theme.ts    # Tailwind 참조 + 게임 데이터
├── server/
│   └── src/
│       ├── game/
│       │   ├── Room.ts        # 방 관리 + phase 상태 머신
│       │   └── Player.ts      # Character 생성 + 배경 적용
│       └── socket/handlers.ts # 소켓 이벤트 핸들러
└── shared/
    └── types.ts               # 공유 타입 + 상수 + 소켓 이벤트
```

## 구현 진행 상황

- [x] **Phase 1**: 프로젝트 셋업 + 로비 + 캐릭터 설정
- [ ] **Phase 2**: 전투 코어 루프 (LLM 없이 하드코딩 데이터로)
- [ ] **Phase 3**: LLM 연동
- [ ] **Phase 4**: 게임 완성 + 모바일 최적화 + 배포

## 문서

- [CLAUDE.md](CLAUDE.md) - 개발 가이드 및 시스템 설계
- [CLAUDE_CODE_PROMPT.md](CLAUDE_CODE_PROMPT.md) - 코어 루프 리팩토링 설계서
