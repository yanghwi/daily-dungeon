# CLAUDE.md - 데일리 던전 프로젝트

## 한 줄 요약

하루 한 판, 4인 협동 던전 탈출 게임. 탐험은 실시간, 전투는 즉시 판정.

## 핵심 철학

- 10분 안에 끝나야 함
- 복잡한 조작 없음
- 결과만 빠르게
- 하루 한 번의 설렘

## 기술 스택

- **프론트엔드**: React + TypeScript + Phaser 3
- **백엔드**: Node.js + Socket.io + Redis
- **AI**: Claude API
- **배포**: Vercel + Railway

## 핵심 시스템

### 1. 하루 한 판
```
- 매일 자정 열쇠 1개 지급
- 최대 3개 누적
- 주말은 2개 지급
- 던전 입장 시 1개 소모
```

### 2. 탐험 (실시간)
```
- 탑다운 2D 맵
- 가상 조이스틱 이동
- 시야 공유
- 위치 동기화 (100ms 간격)
```

### 3. 전투 (즉시 판정)
```
적 조우 → 자동 판정 → 결과 팝업 → LLM이 전투 결과를 턴제로 알려줌 → 탐험 계속

판정 공식:
결과 = (파티 전투력 / 적 전투력) × 랜덤(0.8~1.2)
```

### 4. 탈출
```
- 포탈 도달 → 개별 탈출
- 탈출한 장비만 저장
- 죽으면 장비 드랍
```

## 폴더 구조

```
dungeon-crawler/
├── client/
│   ├── src/
│   │   ├── phaser/
│   │   │   ├── scenes/
│   │   │   │   └── ExploreScene.ts
│   │   │   └── config.ts
│   │   ├── components/
│   │   │   ├── Lobby/
│   │   │   ├── HUD/
│   │   │   └── Popup/
│   │   ├── hooks/
│   │   │   └── useSocket.ts
│   │   └── stores/
│   │       └── gameStore.ts
├── server/
│   ├── src/
│   │   ├── game/
│   │   │   ├── Room.ts
│   │   │   ├── Player.ts
│   │   │   ├── Dungeon.ts
│   │   │   └── Combat.ts      # 즉시 판정 로직
│   │   ├── ai/
│   │   │   └── DungeonGenerator.ts
│   │   ├── services/
│   │   │   └── KeyService.ts  # 열쇠 관리
│   │   └── socket/
├── shared/
│   └── types.ts
└── docs/
```

## Socket 이벤트

### 로비
| 이벤트 | 방향 | 설명 |
|--------|------|------|
| create-room | C→S | 방 생성 |
| join-room | C→S | 방 참가 |
| start-game | C→S | 게임 시작 |

### 탐험
| 이벤트 | 방향 | 설명 |
|--------|------|------|
| player-move | C→S | 위치 업데이트 |
| positions-update | S→C | 전체 위치 브로드캐스트 |
| tile-revealed | S→C | 새 타일 공개 |

### 전투 (즉시)
| 이벤트 | 방향 | 설명 |
|--------|------|------|
| combat-result | S→C | 전투 결과 팝업 |

### 아이템
| 이벤트 | 방향 | 설명 |
|--------|------|------|
| item-pickup | C→S | 아이템 획득 시도 |
| item-acquired | S→C | 아이템 획득 완료 |

### 게임 종료
| 이벤트 | 방향 | 설명 |
|--------|------|------|
| player-escaped | S→C | 플레이어 탈출 |
| player-died | S→C | 플레이어 사망 |
| game-over | S→C | 게임 종료 |

## 개발 우선순위

1. 로비 + 방 시스템
2. 탐험 모드 (맵 + 이동 + 동기화)
3. 시야 시스템
4. 즉시 판정 전투
5. AI 던전 생성
6. 아이템 + 인벤토리
7. 열쇠 시스템 (Redis)
8. 탈출/사망 처리

## 플랫폼 제약

- 아이폰 사파리 필수
- 세로 화면
- 한 손 조작
- 10분 내 완료

## 주의사항

- Phaser 캔버스 위에 React UI 오버레이
- 전투 UI는 React 팝업
- 위치 동기화 100ms 제한
- AI 호출 시 캐싱 필수
- Redis로 열쇠/세션 관리

## 스타일링 규칙

### 필수
- **Tailwind CSS 미사용** (설치되지 않음)
- **Inline Styles + theme.ts** 조합 사용
- 타입: `const styles: Record<string, React.CSSProperties>`

### 참고 파일
- 색상 정의: `client/src/styles/theme.ts`
- 패턴 예시: `client/src/components/Lobby/Home.tsx`

### 금지 사항
```tsx
// ❌ 잘못된 예
className="flex items-center bg-blue-500"  // Tailwind 클래스
backgroundColor: '#1a1a2e'                  // 하드코딩 색상

// ✅ 올바른 예
style={styles.container}
backgroundColor: theme.colors.bgDark
```
