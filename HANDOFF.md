# Handoff: 몬스터 스프라이트 PNG 업그레이드

## 목표

CSS box-shadow 픽셀아트 → AI 생성 PNG 이미지로 몬스터 스프라이트 교체

## 완료된 작업

### 코드 변경 (빌드 검증 완료)

1. **`client/src/assets/sprites/EnemySprite.tsx`** — 리라이트 완료
   - `/sprites/{imageTag}.png` 이미지를 우선 로드 시도
   - 로드 실패 시 기존 box-shadow로 자동 폴백 (`useState` + `onError`)
   - PNG 모드: 일반 160px, 보스 200px 표시
   - box-shadow 폴백: 기존 로직 100% 유지

2. **`client/src/assets/sprites/spriteAnimations.css`** — GPU 힌트 추가
   - `.sprite-animate { will-change: transform, opacity, filter; }` 클래스 추가

3. **`client/public/sprites/`** — 디렉토리 생성 완료 (비어있음)

### 변경하지 않은 파일

- `spriteData.ts` — 기존 인터페이스 그대로 유지 (하위 호환성)
- `BattleScreen.tsx` — EnemySprite 호출 시그니처 동일
- 서버 코드 — 변경 없음

## 남은 작업

### 1. 이미지 생성 (18종)

ChatGPT/DALL-E 3에서 아래 공통 프롬프트 + 몬스터별 프롬프트로 생성:

**공통 프롬프트:**
```
Generate an EarthBound/Mother 2 SNES-style enemy battle sprite.
Style: 32-bit pixel art, limited palette (5-6 colors), clean black outlines,
slightly psychedelic/surreal like EarthBound enemies, cute but unsettling.
Setting: Late-night Korean urban night market.
256x256px, transparent background, centered full body facing forward, no text.
```

**몬스터별 프롬프트:**

| imageTag | 파일명 | 프롬프트 |
|----------|--------|---------|
| `raccoon` | raccoon.png | Angry raccoon family rummaging through trash. Father raccoon with fierce glowing eyes, 2-3 baby raccoons behind him. Gray fur, black face mask markings. |
| `vending-machine` | vending-machine.png | Haunted vending machine with cracked screen showing angry red eyes. Shooting soda cans. Small mechanical legs. Glitchy display. |
| `shadow-cats` | shadow-cats.png | Pack of shadow cats — dozens of glowing purple/yellow eyes in overlapping dark silhouettes. Ethereal, semi-transparent. |
| `cleaning-robot` | cleaning-robot.png | Industrial cleaning robot gone berserk. Red LED eyes, spinning brush arms, circular body. Soap suds trail. |
| `market-boss` | market-boss.png | **(보스)** Large imposing figure wearing a giant smiling cat mask, night market vendor apron, holding a giant ladle. Make it larger and more detailed. |
| `delivery-bike` | delivery-bike.png | Possessed delivery motorcycle. Steam from delivery box. Headlight as angry eye. Orders piling out. |
| `mannequins` | mannequins.png | Group of 3 department store mannequins. Featureless white faces, stiff poses, slightly tilted heads. Eerily watching. |
| `neon-ghost` | neon-ghost.png | Neon sign ghost — Korean characters (영업중) assembled into a glowing humanoid shape. Flickering, electric. |
| `antenna-monster` | antenna-monster.png | Rooftop TV antenna mutated into tentacle creature. Metal arms reaching out, sparking with electricity. |
| `midnight-clock` | midnight-clock.png | **(최종보스)** Awakened clock tower entity. Giant golden clock face with furious eyes, swinging pendulum, gears exposed, purple time-warping energy. Make it imposing and detailed. |
| `stray-dog` | stray-dog.png | Large stray dog with red bandana. Muscular, baring teeth, guarding night market scraps. |
| `traffic-light` | traffic-light.png | Malfunctioning traffic light with all three lights as angry eyes. Stick-figure metal arms. Sparking wires. |
| `sewer-rats` | sewer-rats.png | Swarm of rats pouring from manhole cover. Dozens of small red-eyed rats in wave formation. |
| `shopping-cart` | shopping-cart.png | Runaway shopping cart overflowing with items. Glowing red eyes on front. Wheels spinning wildly. |
| `food-cart` | food-cart.png | Street food cart on fire, wheels spinning, charging forward. Smoke and flames trailing. |
| `umbrella-ghost` | umbrella-ghost.png | Traditional umbrella ghost (karakasa) — purple umbrella with one big red eye, a tongue, hopping on one leg. |
| `broken-tv` | broken-tv.png | Vintage CRT television walking on tiny legs. Static on screen with one eye visible. Sparks of electricity. |
| `electric-pole` | electric-pole.png | Mutated electric utility pole. Power lines as tentacles/whips, sparking at tips. Transformer box as head. |

**저장 위치:** `client/public/sprites/{imageTag}.png`

### 2. 이미지 최적화

- pngquant 또는 tinypng.com으로 압축 (목표: 20-50KB/장)
- 투명 배경 확인 (DALL-E가 배경을 넣으면 제거 필요)

### 3. 실기기 검증

- iPhone Safari 세로 모드에서 렌더링/애니메이션 확인
- `SPRITE_SIZE`(160px), `BOSS_SIZE`(200px) 값 조정이 필요할 수 있음
- `imageRendering: 'pixelated'`이 의도대로 보이는지 확인 (실사풍이면 제거 고려)

### 4. (선택) 추후 개선

- box-shadow 폴백 코드 제거 → `spriteData.ts`의 boxShadow 데이터 정리
- Vite static import 방식으로 전환 (캐시 해시 자동 부여)
- 적 등장/퇴장 애니메이션 PNG에 맞게 튜닝

## 핵심 파일 참조

| 파일 | 역할 |
|------|------|
| `client/src/assets/sprites/EnemySprite.tsx` | 스프라이트 렌더링 (수정 완료) |
| `client/src/assets/sprites/spriteData.ts` | box-shadow 데이터 + 애니메이션 메타 (미변경) |
| `client/src/assets/sprites/spriteAnimations.css` | CSS 애니메이션 정의 (GPU 힌트 추가) |
| `client/src/components/Battle/BattleScreen.tsx` | EnemySprite 사용처 (미변경) |
| `client/public/sprites/` | PNG 이미지 저장 위치 (비어있음) |

## 동작 방식

```
이미지 있음: /sprites/{imageTag}.png → <img> 렌더링 + CSS 애니메이션
이미지 없음: onError 발생 → imgFailed=true → box-shadow 폴백 렌더링
```

점진적 마이그레이션 가능 — 이미지를 하나씩 추가해도 나머지는 box-shadow로 표시됨.
