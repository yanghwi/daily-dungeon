# Developer Guide - Round Midnight

## 빌드

```bash
# ❌ 전체 빌드 (shared에 build 스크립트 없어서 실패)
npm run build

# ✅ 개별 워크스페이스 빌드
npm run build --workspace=@round-midnight/client
npm run build --workspace=@round-midnight/server
```

## Socket 이벤트 추가 체크리스트

1. `shared/types.ts`에 페이로드 타입 정의
2. `shared/types.ts`의 `SOCKET_EVENTS`에 이벤트 이름 추가
3. `server/src/socket/handlers.ts`에 핸들러 추가
4. `client/src/hooks/useSocket.ts`에 리스너 추가
5. `client/src/stores/gameStore.ts`에 상태 추가

## 코드 작성 규칙 (교훈 모음)

- **Props/함수를 만들면 반드시 연결할 것**: props를 컴포넌트에 추가하면 호출하는 쪽에서도 전달해야 함. "나중에 쓸 거니까 미리 만들어두자"는 dead code를 만듦
- **중복 데이터 소스 금지**: 같은 로직을 함수(`getWaveBackground()`)와 Record(`WAVE_BACKGROUNDS`)로 이중 구현하지 말 것. 하나만 유지
- **새 파일 import 확인**: 기존 코드가 존재하지 않는 모듈을 import하고 있을 수 있음 (예: `logger.ts` 누락). 빌드 검증 필수
- **배경 데이터**: `getWaveBackground(waveNumber, isBoss, bossType)`으로 배경 선택. `client/src/assets/backgrounds/backgroundData.ts`
- **`waiting` phase 바이패스 금지**: 방 생성 후 반드시 LobbyScreen(`waiting`)을 거쳐야 함. 클라이언트에서 `ROOM_CREATED` 수신 직후 자동으로 `START_GAME`을 emit하면 다른 플레이어가 참가할 수 없어 사실상 솔로 전용이 됨. 게임 시작은 항상 호스트가 로비에서 수동으로 트리거할 것
- **클라이언트→서버 데이터 파이프라인 반드시 검증**: 소켓 emit 시 클라이언트가 보유한 데이터(예: `authUser.id`)를 payload에 포함했는지, 서버 핸들러가 해당 필드를 모델 생성 함수에 전달하는지, 최종적으로 모델 객체에 값이 설정되는지 전 구간을 확인할 것. optional 필드(`userId?`)가 `undefined`면 `.filter(p => p.userId)` 같은 하류 로직에서 무음 실패(0건 저장, 에러 없음)를 일으킴

## 캐릭터 시스템

| 배경 | 특성 | 약점 | 보정 |
|------|------|------|------|
| 전직 경비원 | 용감한 | 어둠을 무서워함 | physical/defensive +2 |
| 요리사 | 호기심 많은 | 거미 공포증 | creative +2 |
| 개발자 | 겁 많은 | 사회적 상황에 약함 | technical +2 |
| 영업사원 | 말빨 좋은 | 체력이 약함 | social +2 |

### 레벨 보너스

- HP: `+2/레벨` (캡 14) → Lv1: 20HP, Lv3: 24HP, Lv5: 28HP, Lv8+: 34HP
- DC: Lv5에서 전체 DC -1, Lv10에서 추가 DC -1 (총 -2)
- 비로그인: level=1 (보너스 없음)

## 주사위 시스템 (d20)

| d20 결과 | RollTier | 설명 |
|----------|----------|------|
| 20 (nat20) | `nat20` | 항상 성공, 적에게 3배 데미지 |
| DC+critMin 이상 | `critical` | 강력한 성공, 2배 데미지 (기본 critMin=5, crit_expand 효과로 감소) |
| DC 이상 | `normal` | 보통 성공 |
| DC 미만 | `fail` | 실패, 약간의 피해 |
| 1 (nat1) | `nat1` | 항상 실패, 풀 데미지 |

## 몬스터 레지스트리 + 웨이브 풀

### 몬스터 레지스트리 (`monsterRegistry.ts`)
- **단일 진실의 원천**: 134개 몬스터 정의 (id, name, description, imageTag, tier, category, baseHp, baseAttack, defense)
- **8개 카테고리**: `animal | humanoid | machine | supernatural | insect | plant | blob | boss`
- **5개 티어**: 스탯 범위 자동 산출 (`deriveStats()` — 티어별 범위 내 ID 기반 해시)
- **내보내기**: `MONSTER_REGISTRY`, `MONSTER_BY_ID`, `MONSTER_BY_TAG`, `MONSTERS_BY_TIER`, `ALL_IMAGE_TAGS`, `WAVE_TIER_MAP`

### 적 추가 워크플로우
1. `monsterRegistry.ts`에 `MonsterEntry` 추가 (imageTag, name, description, tier, category)
2. `spriteData.ts`의 `SPRITE_CATEGORIES`에 해당 카테고리에 imageTag 추가 (일괄 등록 루프가 SpriteConfig 자동 생성)
3. `client/public/sprites/`에 `{imageTag}.png` 파일 배치
4. `situationGenerator.ts`의 `VALID_IMAGE_TAGS`는 `ALL_IMAGE_TAGS`를 자동 import하므로 별도 수정 불필요
5. `hardcodedData.ts`의 `EXPANDED_WAVE_POOLS`도 레지스트리 기반 자동 빌드이므로 별도 수정 불필요

### 웨이브 풀 시스템
- **확장 풀**: `EXPANDED_WAVE_POOLS` — 기존 18개 하드코딩 + 레지스트리 134개 자동 합산 (티어→웨이브 매핑)
- **티어→웨이브**: tier1→wave1-3, tier2→wave3-5, tier3→wave5-7, tier4→wave7-9, tier5→boss(5,10)
- **선택**: `getWaveTemplateFromPool(waveNumber, pick?)`으로 풀에서 선택
- **시드 기반 선택**: 데일리 모드는 `SeededRandom("${seed}-wave-${waveNumber}")`으로 결정적, 커스텀 모드는 `Math.random()`
- **보스 잠금**: `parseLLMSituation()`에서 `waveNumber % 5 === 0`이면 LLM 출력(name/description/imageTag) 무시, 템플릿 강제
- **카테고리 템플릿**: 레지스트리 몬스터의 LLM 폴백 시 `CATEGORY_TEMPLATES`에서 카테고리별 제네릭 상황/선택지 사용

### 스프라이트 시스템
- **전체 PNG 기반**: 모든 적이 `/sprites/{imageTag}.png` 사용 (box-shadow 제거)
- **`EnemySprite.tsx`**: PNG 로드 후 `boxShadow`가 비어있으면 자동 PNG 렌더링 (SPRITE_SIZE=160, BOSS_SIZE=200)
- **카테고리별 애니메이션**: `CATEGORY_ANIM` 매핑 (animal→idle-bounce, humanoid→idle-twitch 등)
- **스프라이트 리네이밍**: `scripts/rename-sprites.py`로 sprite_NNN.png → imageTag.png 변환

### LLM 가드레일
- **LLM 내러티브**: `buildNarrativeMessage()`에 `enemyDefeated` 전달 → LLM이 적 생사를 알고 자연스럽게 서술
- **이전 웨이브 누출 방지**: 모든 LLM 시스템 프롬프트에 "이전 웨이브 적 언급 금지" 규칙 포함

## 아이템 효과 시스템 + 3축 성장

- **단일 진실 소스**: 장비 보너스는 `ItemEffectResolver.resolveEquippedEffects()`가 집계한 `ResolvedEffects`를 사용. `character.equipment.weaponBonus`를 직접 읽지 말 것
- **resolveEquippedEffects 집계 순서**: 기존 장비 → 카탈로그 아이템 → 임시 버프 → 시너지 → 레벨 DC → 패시브 해금
- **시너지**: `SynergyResolver.ts`에서 태그 카운팅 → 최고 tier 효과 반환 → `ItemEffect[]`로 applyEffect에 전달
- **레벨 DC**: `GAME_CONSTANTS.LEVEL_BONUSES.DC_REDUCTION_LEVELS`에 따라 dcReductions('all')에 누적
- **패시브 해금**: `character.unlockedPassives: ItemEffect[]`를 applyEffect로 적용
- **DiceEngine.calculateBonus(character, category, resolved?)**: `resolved`가 있으면 집계된 보너스 사용, 없으면 기존 character.equipment에서 직접 읽기 (하위 호환)
- **소모품 임시 버프**: `useConsumable()` → `activeBuffs`에 `remainingWaves: 1`로 추가 → `resolveEquippedEffects()`에서 집계 → 웨이브 종료 시 `expireBuffs()`로 만료
- **인벤토리 제한**: `GAME_CONSTANTS.MAX_RUN_INVENTORY = 20`, 초과 시 `addItemToInventory()` 원래 객체 반환, `LootItem.inventoryFull` 플래그로 UI 알림

## LLM 의존 시스템 설계

- 반드시 폴백 로직 구현 (API 키 없을 때, API 실패 시)
- 하드코딩 폴백: `server/src/game/data/hardcodedData.ts`
