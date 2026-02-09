/**
 * 134개 몬스터 레지스트리 — 단일 진실의 원천
 *
 * 기존 18개 적(hardcodedData.ts)과 별개로, EarthBound 스프라이트 기반 새 몬스터 풀.
 * 이 파일의 imageTag는 기존 18개와 겹치지 않는다.
 */

export type MonsterCategory = 'animal' | 'humanoid' | 'machine' | 'supernatural' | 'insect' | 'plant' | 'blob' | 'boss';

export interface MonsterEntry {
  id: number;
  name: string;
  description: string;
  imageTag: string;
  tier: 1 | 2 | 3 | 4 | 5;
  category: MonsterCategory;
  baseHp: number;
  baseAttack: number;
  defense: number;
}

// ===== 티어별 스탯 범위 =====

const TIER_RANGES: Record<number, { hp: [number, number]; atk: [number, number]; def: [number, number] }> = {
  1: { hp: [35, 50], atk: [6, 9], def: [2, 4] },
  2: { hp: [55, 75], atk: [10, 15], def: [4, 6] },
  3: { hp: [75, 105], atk: [15, 20], def: [6, 9] },
  4: { hp: [105, 120], atk: [20, 23], def: [9, 11] },
  5: { hp: [130, 160], atk: [23, 28], def: [10, 14] },
};

function deriveStats(id: number, tier: number) {
  const r = TIER_RANGES[tier];
  return {
    baseHp: r.hp[0] + ((id * 13 + 7) % (r.hp[1] - r.hp[0] + 1)),
    baseAttack: r.atk[0] + ((id * 7 + 3) % (r.atk[1] - r.atk[0] + 1)),
    defense: r.def[0] + ((id * 3 + 1) % (r.def[1] - r.def[0] + 1)),
  };
}

// ===== Raw definitions: [imageTag, name, description, tier, category] =====

type Def = [string, string, string, 1 | 2 | 3 | 4 | 5, MonsterCategory];

const DEFS: Def[] = [
  // --- 001~010 ---
  ['scruffy-dog', '누더기 떠돌이 개', '배고파 눈이 사나운 떠돌이 개.', 1, 'animal'],
  ['dark-crow', '불길한 까마귀', '노란 부리가 위협적으로 빛나는 검은 까마귀.', 1, 'animal'],
  ['jade-cobra', '비취 코브라', '똬리를 틀고 혀를 날름거리는 비취색 코브라.', 2, 'animal'],
  ['forest-mage', '숲의 마법사', '초록 로브의 수상한 마법사. 뭔가 주문을 외우고 있다.', 2, 'humanoid'],
  ['horned-demon', '뿔 달린 악마', '보라색 뿔 달린 악마. 공격적인 자세로 으르렁거린다.', 3, 'supernatural'],
  ['rocket-gremlin', '로켓 그렘린', '로켓에 탄 그렘린. 제어 불능으로 날아다닌다.', 3, 'machine'],
  ['wild-donkey', '야생 당나귀', '야생 당나귀. 뒷발질이 무시무시하다.', 1, 'animal'],
  ['shadow-wisp', '그림자 정령', '어둠 속의 작은 그림자 정령. 빨간 눈이 번쩍인다.', 1, 'supernatural'],
  ['sewer-mouse', '하수구 쥐', '하수구에서 기어 나온 초록 쥐. 눈이 이상하게 빛난다.', 1, 'animal'],
  ['suited-gorilla', '정장 고릴라', '정장 입은 고릴라. 주먹을 불끈 쥐고 있다.', 3, 'humanoid'],
  // --- 011~020 ---
  ['poison-shroom', '독버섯', '빨간 점박이 독버섯. 포자를 뿜어대고 있다.', 1, 'plant'],
  ['angry-imp', '성난 임프', '작지만 엄청나게 화난 임프. 입에서 불꽃이 튄다.', 1, 'humanoid'],
  ['violet-priest', '보라 사제', '보라 법복의 수상한 사제. 기도인지 저주인지 알 수 없다.', 2, 'humanoid'],
  ['crimson-showman', '진홍 쇼맨', '빨간 턱시도의 쇼맨. 위험한 마술을 준비 중이다.', 3, 'humanoid'],
  ['alley-punk', '골목 불량배', '골목의 불량배. 시비를 걸고 싶어 안달이다.', 1, 'humanoid'],
  ['tiny-sprout', '꼬마 새싹', '아주 작은 새싹 몬스터. 하지만 뿌리가 날카롭다.', 1, 'plant'],
  ['silver-saucer', '은색 비행접시', '은색 비행접시. 수상한 빛줄기를 쏘고 있다.', 2, 'machine'],
  ['great-treant', '거대 나무 정령', '살아 움직이는 거대한 나무. 가지를 휘두른다.', 3, 'plant'],
  ['rabbit-archdemon', '토끼 대악마', '토끼 귀의 대악마. 강대한 마력이 느껴진다.', 4, 'supernatural'],
  ['rabbit-sorcerer', '토끼 주술사', '보라색 토끼 주술사. 지팡이에서 불꽃이 튄다.', 3, 'supernatural'],
  // --- 021~030 ---
  ['cave-bear', '동굴곰', '동굴에서 나온 거대한 곰. 포효가 벽을 울린다.', 3, 'animal'],
  ['tunnel-mole', '땅굴 두더지', '땅굴에서 솟아난 두더지. 앞발이 삽처럼 날카롭다.', 1, 'animal'],
  ['green-bat', '초록 박쥐', '초록빛 박쥐. 초음파 공격이 귀를 찢는다.', 1, 'animal'],
  ['birdcage-witch', '새장 마녀', '새장 모자의 마녀. 새장 속에서 무언가 움직인다.', 3, 'humanoid'],
  ['neon-firefly', '네온 반딧불이', '빛나는 거대 반딧불이. 눈부신 빛으로 혼란을 준다.', 1, 'insect'],
  ['trash-critter', '쓰레기통 괴물', '쓰레기통에서 나온 정체불명의 생물. 악취가 진동한다.', 1, 'animal'],
  ['scarlet-naga', '진홍 나가', '진홍빛 나가. 인간의 얼굴에 뱀의 몸을 가졌다.', 3, 'supernatural'],
  ['horned-raider', '뿔투구 약탈자', '뿔투구의 약탈자. 방패를 들고 돌진한다.', 3, 'humanoid'],
  ['pumpkin-head', '호박 머리', '호박 머리 괴물. 입에서 불빛이 새어 나온다.', 2, 'supernatural'],
  ['shambling-zombie', '비틀 좀비', '비틀거리는 좀비. 느리지만 멈추지 않는다.', 2, 'supernatural'],
  // --- 031~040 ---
  ['midnight-panther', '자정의 표범', '자정의 검은 표범. 어둠과 하나가 되어 움직인다.', 2, 'animal'],
  ['pale-ghost', '창백한 유령', '창백한 유령. 둥둥 떠다니며 한기를 뿜는다.', 1, 'supernatural'],
  ['club-caveman', '곤봉 원시인', '곤봉을 든 원시인. 뇌보다 근육이 먼저 움직인다.', 2, 'humanoid'],
  ['mountain-ram', '산양', '단단한 뿔로 돌진하는 산양.', 2, 'animal'],
  ['mad-duck', '성난 오리', '성난 오리. 결코 만만하지 않다.', 1, 'animal'],
  ['violet-slime', '보라 슬라임', '보라색 슬라임. 닿으면 녹는다.', 1, 'blob'],
  ['swamp-frog', '늪지 개구리', '늪지 개구리. 혀 공격이 번개처럼 빠르다.', 1, 'animal'],
  ['tribal-warrior', '부족 전사', '부족 전사. 근육과 전투 경험이 남다르다.', 3, 'humanoid'],
  ['scale-fighter', '도마뱀 전사', '직립 도마뱀 전사. 꼬리 공격을 조심해야 한다.', 2, 'animal'],
  ['red-hopper', '빨간 토끼', '빨간 토끼. 작지만 발차기가 무섭다.', 1, 'animal'],
  // --- 041~050 ---
  ['iron-stag-beetle', '쇠갑충', '철갑 같은 등껍질에 거대한 뿔을 가진 쇠갑충.', 4, 'insect'],
  ['cherry-pudding', '체리 푸딩', '분홍 푸딩 슬라임. 달콤한 냄새에 속으면 안 된다.', 1, 'blob'],
  ['flutter-moth', '나풀 나방', '나풀거리는 나방. 비늘 가루가 독이다.', 1, 'insect'],
  ['hover-disc', '호버 디스크', '떠다니는 원반형 기계. 레이저 빔을 발사한다.', 2, 'machine'],
  ['bloated-goblin', '배불뚝이 고블린', '배불뚝이 고블린. 의외로 민첩하다.', 2, 'supernatural'],
  ['toddling-mushroom', '아장 버섯', '아장아장 걷는 버섯. 포자 구름이 위험하다.', 2, 'plant'],
  ['pebble-fungus', '조약돌 균', '돌처럼 생긴 작은 균류. 밟으면 터진다.', 1, 'plant'],
  ['stampede-bison', '돌진 들소', '돌진하는 들소. 한번 달리면 멈출 수 없다.', 3, 'animal'],
  ['gentle-bronto', '순한 공룡', '순해 보이는 공룡. 하지만 꼬리는 가차 없다.', 2, 'animal'],
  ['plump-caterpillar', '통통 애벌레', '통통한 애벌레. 독침이 숨겨져 있다.', 1, 'insect'],
  // --- 051~060 ---
  ['dish-critter', '접시 괴물', '접시 위의 수상한 생물. 어디서 왔는지 알 수 없다.', 1, 'blob'],
  ['gray-wolf', '회색 늑대', '회색 늑대. 날카로운 이빨이 번득인다.', 2, 'animal'],
  ['tin-knight', '양철 기사', '양철 기사. 작지만 검술이 수준급이다.', 2, 'humanoid'],
  ['bone-mask', '해골 가면', '해골 가면의 정체불명 존재. 눈구멍에서 빛이 난다.', 1, 'supernatural'],
  ['armored-hornet', '갑옷 말벌', '갑옷 입은 말벌. 침에 마비독이 있다.', 2, 'insect'],
  ['spindly-bot', '가느다란 로봇', '가느다란 로봇. 관절이 삐걱거린다.', 2, 'machine'],
  ['wriggling-worm', '꿈틀 벌레', '꿈틀거리는 벌레. 보기만 해도 소름 돋는다.', 2, 'blob'],
  ['raging-fatty', '분노한 뚱보', '뚱뚱하지만 분노 가득한 녀석. 몸통 박치기가 위험하다.', 2, 'humanoid'],
  ['cursed-sign', '저주받은 표지판', '저주받은 표지판. 글씨가 스스로 바뀐다.', 1, 'machine'],
  ['trench-coat-man', '트렌치코트 남자', '트렌치코트의 수상한 남자. 주머니에 뭐가 들었을까.', 2, 'humanoid'],
  // --- 061~070 ---
  ['runaway-taxi', '폭주 택시', '손님 없이 미친 듯이 달리는 폭주 택시.', 2, 'machine'],
  ['guitar-lizard', '기타 도마뱀', '기타 치는 도마뱀. 음파 공격이 주특기.', 2, 'animal'],
  ['dark-eyeball', '어둠의 눈알', '어둠 속의 눈알. 한 눈으로 모든 것을 꿰뚫어 본다.', 1, 'blob'],
  ['mad-rooster', '미친 수탉', '미친 수탉. 부리와 발톱이 흉기다.', 2, 'animal'],
  ['haunted-canvas', '빙의된 그림', '빙의된 그림. 액자 속에서 뭔가 기어 나온다.', 2, 'supernatural'],
  ['melting-clock', '녹는 시계', '녹아내리는 시계. 주변의 시간이 뒤틀린다.', 3, 'supernatural'],
  ['rogue-hydrant', '폭주 소화전', '갑자기 물을 뿜어대기 시작한 소화전.', 1, 'machine'],
  ['possessed-pump', '빙의된 주유기', '빙의된 주유기. 기름을 무기로 사용한다.', 2, 'machine'],
  ['retro-robot', '레트로 로봇', '레트로 로봇. 구식이지만 힘은 건재하다.', 2, 'machine'],
  ['ribbon-mouse', '리본 쥐', '리본 쥐. 귀여운 외모에 속으면 큰일 난다.', 1, 'animal'],
  // --- 071~080 ---
  ['titan-beetle', '타이탄 딱정벌레', '거대 딱정벌레. 등껍질이 강철보다 단단하다.', 4, 'insect'],
  ['venus-trap', '거대 파리지옥', '거대 파리지옥. 벌린 입이 위협적이다.', 3, 'plant'],
  ['frost-bear', '얼음 곰', '얼음 곰. 입김이 모든 것을 얼린다.', 3, 'animal'],
  ['dustball', '먼지 뭉치', '먼지 뭉치 생물. 재채기를 유발한다.', 1, 'blob'],
  ['dusk-bat', '황혼 박쥐', '황혼의 박쥐. 주황빛 날개가 스산하다.', 1, 'animal'],
  ['sea-stallion', '해마 기사', '해마 기사. 물줄기를 뿜어 공격한다.', 2, 'animal'],
  ['psychic-snail', '사이키 달팽이', '사이키델릭 달팽이. 환각을 유발하는 줄무늬.', 2, 'supernatural'],
  ['sinister-puppet', '섬뜩한 인형', '섬뜩한 인형. 누가 줄을 당기고 있는 걸까.', 3, 'supernatural'],
  ['ooze-phantom', '흘러내리는 유령', '흘러내리는 유령 슬라임. 잡으려 하면 빠져나간다.', 2, 'blob'],
  ['patrol-drone', '순찰 드론', '순찰 드론. 레이더로 추적해온다.', 2, 'machine'],
  // --- 081~090 ---
  ['spider-mech', '거미 로봇', '거미 로봇. 여섯 개의 다리가 위협적이다.', 3, 'machine'],
  ['magma-snail', '용암 달팽이', '용암 달팽이. 껍질이 뜨겁게 달아올라 있다.', 2, 'supernatural'],
  ['gilded-automaton', '황금 자동인형', '화려하지만 치명적인 황금 자동인형.', 4, 'machine'],
  ['corrupt-officer', '타락한 경관', '타락한 경관. 법을 악용한다.', 3, 'humanoid'],
  ['shades-brawler', '선글라스 싸움꾼', '선글라스 싸움꾼. 주먹에 자신 있는 표정이다.', 3, 'humanoid'],
  ['elder-mummy', '고대 미라', '고대 미라. 붕대 사이로 저주가 스며든다.', 4, 'supernatural'],
  ['thorned-fiend', '가시 악마', '가시투성이 악마. 가까이 가면 찔린다.', 3, 'supernatural'],
  ['floating-lips', '떠다니는 입술', '공중에 뜬 거대한 입술. 키스 공격을 한다.', 2, 'supernatural'],
  ['face-serpent', '인면사', '인면사. 인간의 얼굴로 웃으며 다가온다.', 3, 'supernatural'],
  ['storm-cloud', '분노한 뇌운', '분노한 뇌운. 번개를 마구 내리친다.', 3, 'supernatural'],
  // --- 091~100 ---
  ['plate-imp', '접시 임프', '접시 위의 임프. 접시를 무기로 던진다.', 1, 'blob'],
  ['one-eyed-stalker', '외눈 추적자', '외눈의 추적자. 긴 다리로 끈질기게 쫓아온다.', 2, 'supernatural'],
  ['armored-orb', '장갑 구체', '장갑 구체. 구르면서 돌진한다.', 3, 'machine'],
  ['crown-serpent', '왕관 뱀', '왕관 뱀. 줄무늬 몸에 위엄이 서려 있다.', 3, 'animal'],
  ['kiss-blob', '키스 블롭', '입술 모양 블롭. 납작하게 달라붙는다.', 1, 'blob'],
  ['giant-larva', '거대 유충', '거대 유충. 화난 표정으로 돌진한다.', 3, 'insect'],
  ['dusk-spider', '황혼 거미', '황혼의 거미. 보라 독을 가진 팔다리.', 3, 'insect'],
  ['crimson-ogre', '진홍 오우거', '진홍 오우거. 압도적인 근력의 거인.', 4, 'humanoid'],
  ['singing-cat', '노래하는 고양이', '노래하는 고양이. 음파로 정신을 혼란시킨다.', 1, 'animal'],
  ['wisp-serpent', '유령 뱀', '유령 뱀. 반투명한 몸이 스르르 미끄러진다.', 2, 'supernatural'],
  // --- 101~110 ---
  ['golden-titan', '황금 거인', '압도적인 존재감의 금빛 골렘.', 5, 'boss'],
  ['mud-toad', '진흙 두꺼비', '진흙 속에서 갑자기 솟아오르는 진흙 두꺼비.', 2, 'blob'],
  ['pincer-crab', '집게 게', '집게와 촉수를 동시에 휘두르는 게.', 3, 'animal'],
  ['mini-saucer', '소형 비행접시', '소형 비행접시. 윙윙거리며 빔을 쏜다.', 1, 'machine'],
  ['coral-pony', '산호 조랑말', '바다에서 왔는지 갈기가 해초 같은 조랑말.', 2, 'animal'],
  ['elder-oak', '고대 참나무', '고대 참나무. 뿌리로 대지를 뒤흔든다.', 4, 'plant'],
  ['emerald-knight', '에메랄드 기사', '에메랄드 기사. 창과 방패로 무장했다.', 4, 'humanoid'],
  ['arcane-wizard', '마도사', '마도사. 지팡이에서 마력이 쏟아진다.', 3, 'humanoid'],
  ['pastel-unicorn', '파스텔 유니콘', '파스텔 유니콘. 뿔에서 무지개빛 빔을 쏜다.', 2, 'animal'],
  ['coiled-wyrm', '또아리 와이번', '거대한 몸으로 길을 막는 와이번.', 3, 'animal'],
  // --- 111~120 ---
  ['pumpkin-blob', '호박 블롭', '주황색 공이 데굴데굴 굴러온다.', 1, 'blob'],
  ['solar-face', '태양의 얼굴', '태양의 얼굴. 눈부신 빛으로 시야를 빼앗는다.', 3, 'supernatural'],
  ['bell-robot', '종 로봇', '종 모양 로봇. 종소리에 맞춰 공격한다.', 2, 'machine'],
  ['evil-eye', '사악한 눈', '사악한 눈. 응시만으로 저주를 건다.', 1, 'supernatural'],
  ['jovial-dragon', '느긋한 드래곤', '웃고 있지만 브레스는 무자비한 드래곤.', 5, 'boss'],
  ['stone-face', '돌 얼굴', '돌 얼굴. 표정 없는 눈이 소름 끼친다.', 3, 'blob'],
  ['baby-rex', '아기 공룡', '아기 공룡. 이빨이 아직 날카롭다.', 2, 'animal'],
  ['phantom-skull', '유령 해골', '유령 해골. 공중에서 이를 딱딱 부딪친다.', 2, 'supernatural'],
  ['mad-professor', '미친 교수', '미친 교수. 수상한 실험 도구를 들고 있다.', 2, 'humanoid'],
  ['sinister-professor', '불길한 교수', '불길한 교수. 안경 뒤의 눈빛이 위험하다.', 3, 'humanoid'],
  // --- 121~134 ---
  ['flame-wraith', '불꽃 원령', '불꽃 원령. 닿으면 모든 것이 타오른다.', 3, 'supernatural'],
  ['wandering-sage', '방랑 현자', '보잘것없어 보이지만 지팡이가 심상치 않은 현자.', 2, 'humanoid'],
  ['twin-watchers', '쌍둥이 감시자', '쌍둥이 감시자. 동시에 두 방향을 본다.', 2, 'supernatural'],
  ['molecular-drone', '분자 드론', '분자 드론. 불안정한 에너지가 감돈다.', 3, 'machine'],
  ['chomping-lips', '깨무는 입술', '공중에서 이빨을 덜컥이는 입술.', 2, 'blob'],
  ['volt-toad', '전기 두꺼비', '전기 두꺼비. 온몸에서 스파크가 튄다.', 3, 'animal'],
  ['dread-guardian', '공포의 수호자', '거대한 갑옷이 길을 가로막는 수호자.', 5, 'boss'],
  ['cyclops-lurker', '외눈 잠복자', '기묘한 프로포션의 수상한 외눈 존재.', 3, 'supernatural'],
  ['wyrm-dragon', '긴 용', '동양풍 용의 위엄이 서려 있는 긴 용.', 4, 'animal'],
  ['blade-sphere', '칼날 구체', '회전하며 모든 것을 베는 칼날 구체.', 3, 'machine'],
  ['kraken-spawn', '크라켄의 자식', '촉수가 사방으로 뻗는 크라켄의 자식.', 4, 'animal'],
  ['shadow-wings', '그림자 날개', 'V자로 날카롭게 날아드는 그림자 날개.', 3, 'supernatural'],
  ['staff-phantom', '지팡이 유령', '한 손에 지팡이를 쥔 채 떠다니는 유령.', 2, 'supernatural'],
  ['infernal-knight', '지옥 기사', '붉은 갑옷에서 열기가 뿜어지는 지옥 기사.', 4, 'humanoid'],
];

// ===== Full registry with derived stats =====

export const MONSTER_REGISTRY: MonsterEntry[] = DEFS.map((def, i) => {
  const id = i + 1;
  const [imageTag, name, description, tier, category] = def;
  const stats = deriveStats(id, tier);
  return { id, imageTag, name, description, tier, category, ...stats };
});

// ===== Lookup indexes =====

export const MONSTER_BY_ID = new Map(MONSTER_REGISTRY.map(m => [m.id, m]));
export const MONSTER_BY_TAG = new Map(MONSTER_REGISTRY.map(m => [m.imageTag, m]));

export const MONSTERS_BY_TIER: Record<number, MonsterEntry[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
for (const m of MONSTER_REGISTRY) {
  MONSTERS_BY_TIER[m.tier].push(m);
}

/** situationGenerator에서 사용 — 모든 유효한 imageTag */
export const ALL_IMAGE_TAGS = new Set(MONSTER_REGISTRY.map(m => m.imageTag));

/** 웨이브→허용 티어 매핑 (보스 웨이브 제외) */
export const WAVE_TIER_MAP: Record<number, number[]> = {
  1: [1], 2: [1], 3: [1, 2], 4: [2],
  5: [],  // boss — locked
  6: [3], 7: [3], 8: [3, 4], 9: [4],
  10: [], // boss — locked
};
