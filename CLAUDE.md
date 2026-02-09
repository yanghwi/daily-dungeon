# CLAUDE.md - Round Midnight

4인 협동 웹 로그라이트. EarthBound 톤 + D&D식 선택지 + d20 주사위. 아이폰 사파리, 침대에서 15분.

## 반드시 기억할 것

- **빌드는 개별 워크스페이스만**: `npm run build --workspace=@round-midnight/client` 또는 `--workspace=@round-midnight/server`
- **Socket 이벤트 추가 시 5곳 수정**: shared/types.ts(타입+이벤트명) → server handlers.ts → client useSocket.ts → gameStore.ts
- **LLM 의존 기능은 반드시 폴백 구현**: 폴백 데이터는 `server/src/game/data/hardcodedData.ts`
- **장비 보너스는 `ResolvedEffects`만 사용**: `ItemEffectResolver.resolveEquippedEffects()`의 반환값으로 읽을 것
- **새 적 추가 시 3곳 동기화**: `spriteData.ts` + `hardcodedData.ts` + `situationGenerator.ts`(VALID_IMAGE_TAGS)
- **클라이언트→서버 데이터 파이프라인 전 구간 검증**: optional 필드가 `undefined`면 하류에서 무음 실패
- **UI/디자인 작업 시**: `docs/design-system/` 필수 참조
- **플랫폼**: 아이폰 사파리 세로, 한 손 엄지, 10분

## 하지 말 것

- **`npm run build` 전체 빌드 금지** (shared에 build 스크립트 없어서 실패)
- **하드코딩 색상 / 인라인 스타일 금지**: Tailwind 클래스만 사용 (`bg-midnight-700`, `text-arcane-light`)
- **중복 데이터 소스 금지**: 같은 로직을 함수와 Record로 이중 구현하지 말 것
- **Props/함수 만들고 연결 안 하기 금지**: dead code를 만듦
- **`character.equipment.weaponBonus` 직접 읽기 금지**: `ResolvedEffects` 사용
- **서버 실행 중 `prisma generate` 금지**: Windows DLL 잠금으로 실패
- **보스 웨이브(5, 10) LLM 출력으로 교체 금지**: 코드 레벨 잠금, 템플릿 강제

## 상세 문서

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - 기술 스택, 폴더 구조, Socket 이벤트, RunPhase 상태 머신, 스타일링, Prisma
- [docs/DEV-GUIDE.md](docs/DEV-GUIDE.md) - 개발 주의사항, 캐릭터/주사위/아이템/웨이브 시스템 상세
- [docs/PROGRESS.md](docs/PROGRESS.md) - Phase별 구현 진행 상황
- [docs/GAME-DESIGN.md](docs/GAME-DESIGN.md) - 게임 설계서 (타입, 코어 루프, 데미지 공식)
- [docs/design-system/](docs/design-system/) - Mother/Earthbound 디자인 시스템
