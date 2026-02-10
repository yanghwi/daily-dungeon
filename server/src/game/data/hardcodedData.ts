import type {
  Enemy,
  ChoiceOption,
  ActionCategory,
  LootItem,
  RollTier,
} from '@round-midnight/shared';
import { GAME_CONSTANTS } from '@round-midnight/shared';
import {
  MONSTER_REGISTRY,
  MONSTERS_BY_TIER,
  WAVE_TIER_MAP,
  type MonsterEntry,
  type MonsterCategory,
} from './monsterRegistry.js';

// ===== 웨이브 템플릿 =====

export interface WaveTemplate {
  enemy: Omit<Enemy, 'hp' | 'maxHp' | 'attack'>; // hp/atk는 스케일링 후 결정, defense는 enemy 안에 포함
  baseHp: number;
  baseAttack: number;
  situation: string;
  /** 배경별 선택지 (2~3개씩) */
  choicesByBackground: Record<string, ChoiceOptionTemplate[]>;
  /** 배경에 해당하지 않는 플레이어용 기본 선택지 */
  defaultChoices: ChoiceOptionTemplate[];
}

export interface ChoiceOptionTemplate {
  text: string;
  category: ActionCategory;
  baseDC: number;
}

export const WAVE_TEMPLATES: WaveTemplate[] = [
  // ── Wave 1: 성난 너구리 가족 ──
  {
    enemy: {
      name: '성난 너구리 가족',
      description: '쓰레기통을 뒤지다 눈이 마주친 너구리 일가. 아빠 너구리의 눈빛이 심상치 않다.',
      defense: 3,
      imageTag: 'raccoon',
    },
    baseHp: 45,
    baseAttack: 4,
    situation: '야시장 뒷골목. 쓰레기통에서 뭔가 부스럭거린다. 갑자기 뚜껑이 날아가며 성난 너구리 가족이 튀어나온다! 아기 너구리 세 마리가 뒤에서 끽끽거린다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트를 휘두르며 위협한다', category: 'physical', baseDC: 8 },
        { text: '패딩으로 방어 자세를 취한다', category: 'defensive', baseDC: 9 },
      ],
      '요리사': [
        { text: '남은 음식으로 다른 곳으로 유인한다', category: 'creative', baseDC: 8 },
        { text: '프라이팬을 꺼내 위협한다', category: 'physical', baseDC: 10 },
      ],
      '개발자': [
        { text: '스마트폰 플래시로 눈부시게 한다', category: 'technical', baseDC: 9 },
        { text: '노트북을 방패 삼아 방어한다', category: 'defensive', baseDC: 10 },
      ],
      '영업사원': [
        { text: '차분한 목소리로 너구리를 진정시킨다', category: 'social', baseDC: 8 },
        { text: '명함을 던져 주의를 돌린다', category: 'creative', baseDC: 10 },
      ],
    },
    defaultChoices: [
      { text: '소리를 질러 쫓아본다', category: 'physical', baseDC: 9 },
      { text: '천천히 뒷걸음질 친다', category: 'defensive', baseDC: 8 },
    ],
  },

  // ── Wave 2: 이상한 자판기 ──
  {
    enemy: {
      name: '이상한 자판기',
      description: '갑자기 스스로 움직이기 시작한 자판기. 캔을 발사하고 있다.',
      defense: 4,
      imageTag: 'vending-machine',
    },
    baseHp: 55,
    baseAttack: 5,
    situation: '골목을 지나니 편의점 앞 자판기가 덜덜 떨고 있다. "음료... 사줘..." 기계음과 함께 자판기가 캔을 마구 발사하기 시작한다!',
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트로 캔을 쳐낸다', category: 'physical', baseDC: 8 },
        { text: '옆 건물 뒤로 숨어 접근한다', category: 'defensive', baseDC: 10 },
      ],
      '요리사': [
        { text: '동전을 넣어 달래본다', category: 'creative', baseDC: 9 },
        { text: '캔을 잡아서 되던진다', category: 'physical', baseDC: 11 },
      ],
      '개발자': [
        { text: '전원 코드를 찾아 뽑는다', category: 'technical', baseDC: 8 },
        { text: '노트북으로 자판기를 해킹한다', category: 'technical', baseDC: 11 },
      ],
      '영업사원': [
        { text: '"사실 저도 힘든 하루였어요" 공감한다', category: 'social', baseDC: 9 },
        { text: '자판기에게 비즈니스 제안을 한다', category: 'social', baseDC: 11 },
      ],
    },
    defaultChoices: [
      { text: '물건을 던져 주의를 끈다', category: 'creative', baseDC: 10 },
      { text: '뒤로 물러나 관찰한다', category: 'defensive', baseDC: 9 },
    ],
  },

  // ── Wave 3: 그림자 고양이 떼 ──
  {
    enemy: {
      name: '그림자 고양이 떼',
      description: '어둠 속에서 수십 개의 눈이 빛난다. 그림자처럼 움직이는 고양이들.',
      defense: 5,
      imageTag: 'shadow-cats',
    },
    baseHp: 65,
    baseAttack: 7,
    situation: '가로등이 깜빡이더니 꺼진다. 어둠 속에서 수십 개의 눈이 빛나기 시작한다. 그림자 고양이 떼가 사방에서 다가온다. 으르렁거리는 소리가 점점 커진다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '열쇠고리 손전등을 켠다', category: 'defensive', baseDC: 10 },
        { text: '배트를 빙글빙글 돌리며 공간을 확보한다', category: 'physical', baseDC: 11 },
      ],
      '요리사': [
        { text: '참치캔을 열어 한쪽으로 던진다', category: 'creative', baseDC: 9 },
        { text: '칼을 빛에 반사시켜 고양이를 현혹한다', category: 'creative', baseDC: 12 },
      ],
      '개발자': [
        { text: '보조배터리로 가로등을 임시 충전한다', category: 'technical', baseDC: 10 },
        { text: '폰으로 고양이 울음소리를 재생한다', category: 'technical', baseDC: 12 },
      ],
      '영업사원': [
        { text: '"우리는 적이 아니에요" 협상한다', category: 'social', baseDC: 10 },
        { text: '고양이 대장에게 다가가 신뢰를 쌓는다', category: 'social', baseDC: 12 },
      ],
    },
    defaultChoices: [
      { text: '큰 소리를 내서 위협한다', category: 'physical', baseDC: 11 },
      { text: '가만히 서서 적대감이 없음을 보인다', category: 'defensive', baseDC: 10 },
    ],
  },

  // ── Wave 4: 폭주 청소로봇 ──
  {
    enemy: {
      name: '폭주 청소로봇',
      description: '빨간 눈을 번쩍이며 돌진하는 산업용 청소로봇. 브러시가 무섭게 회전 중.',
      defense: 6,
      imageTag: 'cleaning-robot',
    },
    baseHp: 75,
    baseAttack: 9,
    situation: '지하도에 들어서자 "청소... 모드... 실행..." 하는 기계음이 울린다. 거대한 산업용 청소로봇이 빨간 눈을 켜고 돌진해온다. 회전 브러시에서 불꽃이 튄다!',
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트로 브러시를 멈추려 한다', category: 'physical', baseDC: 10 },
        { text: '패딩으로 감싼 쓰레기통을 방패로 쓴다', category: 'defensive', baseDC: 11 },
        { text: '뒤에서 킥으로 전원부를 공격한다', category: 'physical', baseDC: 13 },
      ],
      '요리사': [
        { text: '기름을 바닥에 뿌려 미끄러뜨린다', category: 'creative', baseDC: 10 },
        { text: '프라이팬으로 센서를 가린다', category: 'creative', baseDC: 12 },
      ],
      '개발자': [
        { text: '제어 패널을 찾아 긴급 정지 코드를 입력한다', category: 'technical', baseDC: 10 },
        { text: '와이파이로 로봇 펌웨어에 접근한다', category: 'technical', baseDC: 13 },
      ],
      '영업사원': [
        { text: '"당신의 노고에 감사합니다" 감성 어필한다', category: 'social', baseDC: 11 },
        { text: '로봇에게 유급휴가를 제안한다', category: 'social', baseDC: 13 },
      ],
    },
    defaultChoices: [
      { text: '벽 쪽으로 유인해서 부딪치게 한다', category: 'creative', baseDC: 11 },
      { text: '좁은 틈으로 숨는다', category: 'defensive', baseDC: 10 },
    ],
  },

  // ── Wave 5 (미드보스): 야시장의 주인 ──
  {
    enemy: {
      name: '야시장의 주인',
      description: '미소 짓는 거대한 고양이 탈을 쓴 존재. 주변의 노점들이 그의 의지로 움직인다.',
      defense: 8,
      imageTag: 'market-boss',
    },
    baseHp: 95,
    baseAttack: 10,
    situation: '야시장 중앙 광장. 모든 노점의 불이 동시에 꺼졌다가 보라색으로 켜진다. 거대한 고양이 탈을 쓴 존재가 천천히 나타난다. "어서 와. 오늘 밤의 마지막 손님이구나." 노점 포장마차들이 그의 손짓에 따라 움직이기 시작한다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '정면으로 돌진해 탈을 벗긴다', category: 'physical', baseDC: 12 },
        { text: '포장마차를 방패 삼아 접근한다', category: 'defensive', baseDC: 13 },
        { text: '동료를 지키며 방어진을 편다', category: 'defensive', baseDC: 11 },
      ],
      '요리사': [
        { text: '노점 화덕의 불을 이용해 공격한다', category: 'creative', baseDC: 11 },
        { text: '최고의 야식을 만들어 제안한다', category: 'creative', baseDC: 14 },
        { text: '포장마차 기구로 트랩을 만든다', category: 'technical', baseDC: 13 },
      ],
      '개발자': [
        { text: '야시장 전력 시스템을 해킹한다', category: 'technical', baseDC: 11 },
        { text: '보조배터리로 과부하를 일으킨다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"이 야시장의 진짜 가치를 아시나요?" 설득한다', category: 'social', baseDC: 12 },
        { text: '동료들의 사기를 끌어올리는 연설을 한다', category: 'social', baseDC: 10 },
        { text: '계약서를 꺼내 협상을 시도한다', category: 'social', baseDC: 15 },
      ],
    },
    defaultChoices: [
      { text: '주변의 물건을 던져 공격한다', category: 'physical', baseDC: 12 },
      { text: '동료 뒤에서 지원한다', category: 'defensive', baseDC: 11 },
    ],
  },

  // ── Wave 6: 폭주 배달 오토바이 ──
  {
    enemy: {
      name: '폭주 배달 오토바이',
      description: '주문이 999건 밀린 배달 오토바이. 배달통에서 김이 모락모락 난다.',
      defense: 7,
      imageTag: 'delivery-bike',
    },
    baseHp: 85,
    baseAttack: 10,
    situation: '야시장을 벗어나 큰 도로에 접어들었다. 갑자기 뒤에서 미친 듯한 경적이 울린다. 배달통을 세 개나 단 오토바이가 빨간 눈을 번쩍이며 돌진해온다! 배달통에서 뜨거운 국물이 쏟아지고 있다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트로 바퀴를 노린다', category: 'physical', baseDC: 10 },
        { text: '가드레일 뒤로 몸을 숨긴다', category: 'defensive', baseDC: 11 },
      ],
      '요리사': [
        { text: '기름을 도로에 뿌려 미끄러뜨린다', category: 'creative', baseDC: 10 },
        { text: '배달통의 음식 냄새로 유인한다', category: 'creative', baseDC: 12 },
      ],
      '개발자': [
        { text: '배달 앱을 해킹해 경로를 변경한다', category: 'technical', baseDC: 10 },
        { text: '신호등 시스템을 조작한다', category: 'technical', baseDC: 13 },
      ],
      '영업사원': [
        { text: '"배달 완료 처리해 드릴게요!" 설득한다', category: 'social', baseDC: 10 },
        { text: '가짜 배달 주소를 불러준다', category: 'social', baseDC: 12 },
      ],
    },
    defaultChoices: [
      { text: '옆으로 뛰어 피한다', category: 'defensive', baseDC: 10 },
      { text: '물건을 던져 방향을 틀게 한다', category: 'creative', baseDC: 11 },
    ],
  },

  // ── Wave 7: 지하상가 마네킹 무리 ──
  {
    enemy: {
      name: '지하상가 마네킹 무리',
      description: '폐점한 지하상가의 마네킹들. 눈이 없는데 분명 이쪽을 보고 있다.',
      defense: 8,
      imageTag: 'mannequins',
    },
    baseHp: 95,
    baseAttack: 11,
    situation: '지하상가 계단을 내려가니 폐점한 옷가게들이 줄지어 있다. 형광등이 깜빡이자 마네킹들이 일제히 고개를 돌린다. 딸깍, 딸깍. 관절 꺾이는 소리와 함께 마네킹 떼가 다가온다. 미소가 새겨진 얼굴이 형광등 아래서 섬뜩하게 빛난다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트로 선두 마네킹을 쳐서 무너뜨린다', category: 'physical', baseDC: 11 },
        { text: '옷걸이로 바리케이드를 만든다', category: 'defensive', baseDC: 12 },
      ],
      '요리사': [
        { text: '향신료 가루를 뿌려 시야를 가린다', category: 'creative', baseDC: 11 },
        { text: '뜨거운 소스를 관절에 부어 굳힌다', category: 'creative', baseDC: 13 },
      ],
      '개발자': [
        { text: '형광등 전력을 끊어 멈추게 한다', category: 'technical', baseDC: 11 },
        { text: '스마트폰 초음파로 관절을 교란한다', category: 'technical', baseDC: 13 },
      ],
      '영업사원': [
        { text: '"오늘 세일이에요!" 주의를 돌린다', category: 'social', baseDC: 11 },
        { text: '마네킹에게 패션 컨설팅을 제안한다', category: 'social', baseDC: 14 },
      ],
    },
    defaultChoices: [
      { text: '가게 셔터를 내려 길을 막는다', category: 'defensive', baseDC: 11 },
      { text: '진열대를 밀어 도미노처럼 쓰러뜨린다', category: 'physical', baseDC: 12 },
    ],
  },

  // ── Wave 8: 네온사인 요괴 ──
  {
    enemy: {
      name: '네온사인 요괴',
      description: '야시장 간판 글씨들이 빠져나와 합체한 빛의 괴물. 몸에서 "영업중"이 깜빡인다.',
      defense: 9,
      imageTag: 'neon-ghost',
    },
    baseHp: 105,
    baseAttack: 12,
    situation: '다시 야시장으로 돌아왔는데 뭔가 이상하다. 모든 간판의 글씨가 사라져 있다. 하늘을 올려다보니 "떡볶이", "호떡", "타코야키" 글씨들이 뭉쳐서 거대한 빛의 형체를 만들고 있다! "영.업.중..." 으스스한 목소리가 울려 퍼진다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트에 절연 테이프를 감고 돌진한다', category: 'physical', baseDC: 12 },
        { text: '패딩으로 빛을 차단하며 접근한다', category: 'defensive', baseDC: 13 },
      ],
      '요리사': [
        { text: '물을 끼얹어 합선시킨다', category: 'creative', baseDC: 11 },
        { text: '"진짜 맛있는 건 글씨가 아니라 요리!" 도발한다', category: 'creative', baseDC: 14 },
      ],
      '개발자': [
        { text: '전력 차단기를 찾아 내린다', category: 'technical', baseDC: 11 },
        { text: '주파수 간섭으로 네온을 분산시킨다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"당신은 더 좋은 간판이 될 수 있어요" 협상한다', category: 'social', baseDC: 12 },
        { text: '폐업 신고서를 들이밀어 공포를 준다', category: 'social', baseDC: 14 },
      ],
    },
    defaultChoices: [
      { text: '어두운 골목으로 유인해 약화시킨다', category: 'creative', baseDC: 12 },
      { text: '건물 뒤에 숨어 통로를 확보한다', category: 'defensive', baseDC: 12 },
    ],
  },

  // ── Wave 9: 전파 먹는 안테나 ──
  {
    enemy: {
      name: '전파 먹는 안테나',
      description: '옥상 안테나가 변이해 촉수처럼 움직인다. 주변의 전자기기가 미쳐 날뛴다.',
      defense: 10,
      imageTag: 'antenna-monster',
    },
    baseHp: 115,
    baseAttack: 14,
    situation: '건물 옥상으로 올라가니 거대한 통신 안테나가 촉수처럼 구불거리고 있다. 주변 스마트폰이 저절로 켜지고 이상한 주파수가 울린다. 안테나 끝에서 보라색 전기가 사방으로 튄다. 옥상 바닥이 전자기장으로 진동한다!',
    choicesByBackground: {
      '전직 경비원': [
        { text: '고무장갑을 끼고 안테나 기둥을 공격한다', category: 'physical', baseDC: 12 },
        { text: '금속이 아닌 것으로 방어막을 만든다', category: 'defensive', baseDC: 13 },
        { text: '옥상 구조물을 이용해 안테나를 쓰러뜨린다', category: 'physical', baseDC: 14 },
      ],
      '요리사': [
        { text: '알루미늄 호일로 전파를 반사시킨다', category: 'creative', baseDC: 12 },
        { text: '물을 뿌려 합선을 유도한다', category: 'creative', baseDC: 14 },
      ],
      '개발자': [
        { text: '제어 시스템에 접근해 주파수를 교란한다', category: 'technical', baseDC: 12 },
        { text: '안테나의 전원 케이블을 추적해 차단한다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '확성기로 주파수를 상쇄시킨다', category: 'social', baseDC: 12 },
        { text: '"5G 요금제로 업그레이드 해드릴게요!" 교란한다', category: 'social', baseDC: 15 },
      ],
    },
    defaultChoices: [
      { text: '전기가 닿지 않는 곳에서 물건을 던진다', category: 'creative', baseDC: 12 },
      { text: '동료들과 합심해 안테나 기둥을 밀어낸다', category: 'physical', baseDC: 13 },
    ],
  },

  // ── Wave 10 (보스): 자정의 시계 ──
  {
    enemy: {
      name: '자정의 시계',
      description: '야시장 시계탑이 자정에 깨어난 존재. 시간이 뒤틀리고, 종소리가 현실을 찢는다.',
      defense: 12,
      imageTag: 'midnight-clock',
    },
    baseHp: 150,
    baseAttack: 16,
    situation: '모든 전투를 뚫고 야시장 끝에 도착했다. 거대한 시계탑이 서 있다. 시침이 12를 가리키는 순간, 종소리와 함께 시계탑이 일어선다. 주변의 시간이 뒤틀리기 시작한다. 떨어진 캔이 거꾸로 솟아오르고, 비가 위로 내린다. "땡... 땡... 자정이야. 아무도 여기서 나갈 수 없어."',
    choicesByBackground: {
      '전직 경비원': [
        { text: '전력으로 돌진해 시계 문자판을 공격한다', category: 'physical', baseDC: 13 },
        { text: '동료들을 지키며 시간 왜곡을 버텨낸다', category: 'defensive', baseDC: 12 },
        { text: '시계추를 잡아 흔들림을 멈추게 한다', category: 'physical', baseDC: 15 },
      ],
      '요리사': [
        { text: '뜨거운 요리로 시계 톱니바퀴를 녹인다', category: 'creative', baseDC: 12 },
        { text: '시간이 멈춘 음식으로 약점을 찾는다', category: 'creative', baseDC: 14 },
        { text: '폭죽과 화약으로 시계탑을 공격한다', category: 'creative', baseDC: 15 },
      ],
      '개발자': [
        { text: '시계의 내부 메커니즘을 분석해 약점을 파악한다', category: 'technical', baseDC: 12 },
        { text: '시간 왜곡 패턴을 역이용해 루프를 만든다', category: 'technical', baseDC: 15 },
      ],
      '영업사원': [
        { text: '"시간은 금이에요! 거래합시다!" 협상한다', category: 'social', baseDC: 13 },
        { text: '동료들의 의지를 모아 시간 왜곡을 거부한다', category: 'social', baseDC: 12 },
        { text: '"자정이 지나면 당신도 끝이에요" 심리전을 건다', category: 'social', baseDC: 15 },
      ],
    },
    defaultChoices: [
      { text: '모두 합심해 시계 기둥을 밀어낸다', category: 'physical', baseDC: 13 },
      { text: '시간 왜곡을 피하며 약점을 찾는다', category: 'defensive', baseDC: 12 },
    ],
  },

  // ── Wave 11: 거미 로봇 ──
  {
    enemy: {
      name: '거미 로봇',
      description: '여섯 개의 다리가 벽과 천장을 자유자재로 기어다니는 거미 로봇. 레이저 눈이 번뜩인다.',
      defense: 10,
      imageTag: 'spider-mech',
    },
    baseHp: 120,
    baseAttack: 15,
    situation: '시계탑을 넘어 폐공장 지대에 접어들었다. 천장에서 쇳소리가 들리더니 거대한 거미 로봇이 여섯 개의 다리를 펼치며 내려온다. 레이저 눈이 일행을 하나씩 스캔한다. "침입자... 제거... 모드..."',
    choicesByBackground: {
      '전직 경비원': [
        { text: '다리 관절을 배트로 집중 공격한다', category: 'physical', baseDC: 12 },
        { text: '컨베이어 벨트 뒤에 숨어 접근한다', category: 'defensive', baseDC: 13 },
      ],
      '요리사': [
        { text: '기름을 다리 관절에 부어 미끄럽게 만든다', category: 'creative', baseDC: 12 },
        { text: '금속 조각을 프라이팬으로 튀겨 센서를 가린다', category: 'creative', baseDC: 14 },
      ],
      '개발자': [
        { text: '공장 제어 시스템에 접속해 셧다운 코드를 찾는다', category: 'technical', baseDC: 11 },
        { text: '레이저 주파수를 역추적해 교란 신호를 보낸다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"보증 기간 만료입니다!" 혼란을 준다', category: 'social', baseDC: 12 },
        { text: '동료들에게 다리 하나씩 맡기자고 지휘한다', category: 'social', baseDC: 13 },
      ],
    },
    defaultChoices: [
      { text: '공장 기계를 이용해 다리를 끼게 만든다', category: 'creative', baseDC: 12 },
      { text: '좁은 통로로 유인해 움직임을 제한한다', category: 'defensive', baseDC: 12 },
    ],
  },

  // ── Wave 12: 분노한 뇌운 ──
  {
    enemy: {
      name: '분노한 뇌운',
      description: '번개를 마구 내리치는 분노한 뇌운. 구름 속에서 얼굴이 보인다.',
      defense: 11,
      imageTag: 'storm-cloud',
    },
    baseHp: 130,
    baseAttack: 16,
    situation: '옥상을 지나는데 갑자기 하늘이 시커멓게 변한다. 구름 한 덩어리가 건물 사이로 내려오더니 번개를 사방에 내리친다. 구름 속에서 거대한 얼굴이 드러난다. "감히... 내 영역에... 들어오다니!"',
    choicesByBackground: {
      '전직 경비원': [
        { text: '고무 밑창 신발을 믿고 돌진한다', category: 'physical', baseDC: 13 },
        { text: '금속 파이프를 피뢰침 삼아 번개를 유도한다', category: 'defensive', baseDC: 12 },
      ],
      '요리사': [
        { text: '물을 뿌려 구름을 분산시킨다', category: 'creative', baseDC: 12 },
        { text: '연기를 피워 구름의 시야를 교란한다', category: 'creative', baseDC: 14 },
      ],
      '개발자': [
        { text: '건물 피뢰 시스템을 해킹해 전기를 흡수시킨다', category: 'technical', baseDC: 12 },
        { text: '전자기 간섭 장치를 급조한다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"비 예보는 내일인데요?" 혼란을 준다', category: 'social', baseDC: 13 },
        { text: '동료들에게 분산 이동을 지시한다', category: 'social', baseDC: 12 },
      ],
    },
    defaultChoices: [
      { text: '건물 안으로 피해 약점을 찾는다', category: 'defensive', baseDC: 12 },
      { text: '금속 물체를 던져 번개를 유인한다', category: 'creative', baseDC: 13 },
    ],
  },

  // ── Wave 13: 진홍 오우거 ──
  {
    enemy: {
      name: '진홍 오우거',
      description: '압도적인 근력의 진홍 거인. 한 걸음에 아스팔트가 갈라진다.',
      defense: 12,
      imageTag: 'crimson-ogre',
    },
    baseHp: 140,
    baseAttack: 18,
    situation: '다리 아래를 지나는데 콘크리트가 갈라지며 진홍빛 거인이 솟아오른다. 사방의 가로등이 진동으로 꺼지고, 오우거의 포효에 유리창이 와장창 깨진다. 주먹 하나가 승용차만 하다!',
    choicesByBackground: {
      '전직 경비원': [
        { text: '다리 뒤쪽 힘줄을 노린다', category: 'physical', baseDC: 13 },
        { text: '주차된 차를 방패 삼아 접근한다', category: 'defensive', baseDC: 13 },
        { text: '머리를 향해 전력 점프 공격한다', category: 'physical', baseDC: 15 },
      ],
      '요리사': [
        { text: '고추기름을 얼굴에 끼얹는다', category: 'creative', baseDC: 12 },
        { text: '거대한 냄비 뚜껑을 방패로 쓴다', category: 'defensive', baseDC: 14 },
      ],
      '개발자': [
        { text: '근처 건설 장비를 원격 조종한다', category: 'technical', baseDC: 12 },
        { text: '도로 함몰 트랩을 만들어 발을 묶는다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"그 힘이면 이사 알바 시급 5만원!" 회유한다', category: 'social', baseDC: 13 },
        { text: '팀원들의 집중 공격 타이밍을 맞춘다', category: 'social', baseDC: 12 },
      ],
    },
    defaultChoices: [
      { text: '좁은 골목으로 유인해 몸집을 제한시킨다', category: 'creative', baseDC: 13 },
      { text: '팀원과 양쪽에서 협공한다', category: 'physical', baseDC: 13 },
    ],
  },

  // ── Wave 14: 긴 용 ──
  {
    enemy: {
      name: '긴 용',
      description: '동양풍 용의 위엄이 서려 있는 긴 용. 비늘이 달빛에 반짝인다.',
      defense: 13,
      imageTag: 'wyrm-dragon',
    },
    baseHp: 150,
    baseAttack: 19,
    situation: '야시장 뒷편 하천변. 물 위에 안개가 자욱하더니 수면이 갈라지며 동양풍의 긴 용이 몸을 드러낸다. 비늘이 달빛에 번쩍이고, 숨결에서 서리가 피어오른다. 용의 눈이 일행을 내려다본다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '비늘 틈새를 노려 배트를 내리친다', category: 'physical', baseDC: 13 },
        { text: '다리 밑으로 숨어 꼬리 공격을 피한다', category: 'defensive', baseDC: 14 },
        { text: '사슬을 이용해 턱을 묶으려 한다', category: 'physical', baseDC: 15 },
      ],
      '요리사': [
        { text: '불꽃과 기름으로 시야를 가린다', category: 'creative', baseDC: 13 },
        { text: '용의 코앞에 자극적인 향신료를 터뜨린다', category: 'creative', baseDC: 14 },
      ],
      '개발자': [
        { text: '하천변 수문 제어 시스템을 해킹한다', category: 'technical', baseDC: 13 },
        { text: '용의 행동 패턴을 분석해 약점 타이밍을 잡는다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"용왕님, 협상하시죠!" 존경을 표한다', category: 'social', baseDC: 13 },
        { text: '팀원들에게 물가를 이용한 전략을 전달한다', category: 'social', baseDC: 12 },
      ],
    },
    defaultChoices: [
      { text: '물가 지형을 이용해 움직임을 제한한다', category: 'creative', baseDC: 13 },
      { text: '팀원과 번갈아 주의를 끌며 지구전을 편다', category: 'defensive', baseDC: 13 },
    ],
  },

  // ── Wave 15 (보스): 황금 거인 ──
  {
    enemy: {
      name: '황금 거인',
      description: '압도적인 존재감의 금빛 골렘. 한 걸음에 대지가 흔들리고, 금빛 주먹이 모든 것을 분쇄한다.',
      defense: 14,
      imageTag: 'golden-titan',
    },
    baseHp: 180,
    baseAttack: 21,
    situation: '야시장 뒤편 폐금고 터. 땅이 갈라지며 금빛 거인이 솟아오른다. 몸 전체가 순금으로 빛나고, 눈에서 태양빛 같은 광선이 쏟아진다. "이 보물은... 아무도... 가져갈 수 없다..." 모든 금속이 거인에게 끌려간다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '관절 부위를 집중 공격한다', category: 'physical', baseDC: 13 },
        { text: '금속이 아닌 방패로 광선을 막는다', category: 'defensive', baseDC: 13 },
        { text: '동료와 합동으로 다리를 쓸어 넘긴다', category: 'physical', baseDC: 15 },
      ],
      '요리사': [
        { text: '산성 양념을 관절에 부어 부식시킨다', category: 'creative', baseDC: 13 },
        { text: '뜨거운 기름으로 표면을 약화시킨다', category: 'creative', baseDC: 14 },
        { text: '팀원에게 즉석 회복 요리를 만들어준다', category: 'creative', baseDC: 12 },
      ],
      '개발자': [
        { text: '금고 터의 보안 시스템을 재가동한다', category: 'technical', baseDC: 13 },
        { text: '전자기 펄스를 발생시켜 자기장을 교란한다', category: 'technical', baseDC: 15 },
      ],
      '영업사원': [
        { text: '"진짜 가치는 금이 아니에요!" 설득한다', category: 'social', baseDC: 14 },
        { text: '팀원들의 사기를 끌어올리는 연설을 한다', category: 'social', baseDC: 12 },
        { text: '"보물을 지킬 새 관리인을 추천하겠습니다" 제안한다', category: 'social', baseDC: 15 },
      ],
    },
    defaultChoices: [
      { text: '주변 폐기물을 이용해 집중 공격한다', category: 'physical', baseDC: 13 },
      { text: '모두 합심해 약점을 찾으며 버틴다', category: 'defensive', baseDC: 13 },
    ],
  },

  // ── Wave 16: 지옥 기사 ──
  {
    enemy: {
      name: '지옥 기사',
      description: '붉은 갑옷에서 열기가 뿜어지는 지옥 기사. 검에서 용암이 뚝뚝 떨어진다.',
      defense: 13,
      imageTag: 'infernal-knight',
    },
    baseHp: 155,
    baseAttack: 20,
    situation: '폐허가 된 상점가를 지나는데 갑자기 바닥에 균열이 생기며 붉은 빛이 새어 나온다. 용암 같은 열기와 함께 붉은 갑옷의 기사가 검을 들고 올라온다. 주변 아스팔트가 발밑에서 녹아내린다. "도전자... 환영한다..."',
    choicesByBackground: {
      '전직 경비원': [
        { text: '물을 끼얹어 갑옷을 식힌 뒤 배트로 친다', category: 'physical', baseDC: 13 },
        { text: '소화전을 터뜨려 물방벽을 만든다', category: 'defensive', baseDC: 13 },
      ],
      '요리사': [
        { text: '얼음과 물로 갑옷을 급랭시켜 균열을 만든다', category: 'creative', baseDC: 13 },
        { text: '기름을 뿌려 발밑을 미끄럽게 만든다', category: 'creative', baseDC: 14 },
      ],
      '개발자': [
        { text: '소방 시설 원격 기동 시스템을 해킹한다', category: 'technical', baseDC: 13 },
        { text: '열감지 패턴을 분석해 냉각 약점을 찾는다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"직장에서 열받으셨나 봐요" 공감한다', category: 'social', baseDC: 13 },
        { text: '팀원들에게 냉각 공격 순서를 지시한다', category: 'social', baseDC: 13 },
      ],
    },
    defaultChoices: [
      { text: '물가로 유인해 열기를 잠재운다', category: 'creative', baseDC: 13 },
      { text: '거리를 유지하며 약점을 관찰한다', category: 'defensive', baseDC: 13 },
    ],
  },

  // ── Wave 17: 고대 참나무 ──
  {
    enemy: {
      name: '고대 참나무',
      description: '고대 참나무. 뿌리로 대지를 뒤흔들고, 가지가 채찍처럼 휘둘러진다.',
      defense: 14,
      imageTag: 'elder-oak',
    },
    baseHp: 165,
    baseAttack: 21,
    situation: '야시장 한구석의 공원에 도착했다. 거대한 고목 하나가 뿌리를 뽑고 일어선다. 나뭇가지가 채찍처럼 휘둘러지고, 뿌리가 아스팔트를 뚫으며 사방으로 뻗는다. 나무 틈새에서 으스스한 빛이 새어 나온다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트로 가지를 쳐내며 줄기에 접근한다', category: 'physical', baseDC: 14 },
        { text: '뿌리 사이를 피해 안전 지대를 확보한다', category: 'defensive', baseDC: 13 },
      ],
      '요리사': [
        { text: '기름과 불로 줄기를 태운다', category: 'creative', baseDC: 13 },
        { text: '제초제 대용 양념을 뿌리에 붓는다', category: 'creative', baseDC: 15 },
      ],
      '개발자': [
        { text: '공원 관리 시스템으로 스프링클러를 역이용한다', category: 'technical', baseDC: 13 },
        { text: '뿌리 패턴을 분석해 핵심부를 특정한다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"벌목 허가증이 여기 있습니다!" 위협한다', category: 'social', baseDC: 14 },
        { text: '팀원에게 불 공격을 집중하자고 지휘한다', category: 'social', baseDC: 13 },
      ],
    },
    defaultChoices: [
      { text: '불을 사용해 가지를 태운다', category: 'creative', baseDC: 13 },
      { text: '뿌리를 피해 돌아가며 약점을 찾는다', category: 'defensive', baseDC: 14 },
    ],
  },

  // ── Wave 18: 토끼 대악마 ──
  {
    enemy: {
      name: '토끼 대악마',
      description: '토끼 귀의 대악마. 강대한 마력이 현실을 왜곡시킨다.',
      defense: 15,
      imageTag: 'rabbit-archdemon',
    },
    baseHp: 175,
    baseAttack: 23,
    situation: '허공에 보라색 균열이 생기더니 차원의 문이 열린다. 토끼 귀를 가진 대악마가 유유히 걸어 나온다. 주변의 물건들이 저절로 떠오르고, 중력이 뒤바뀐다. 장난스러운 웃음소리가 사방에서 울린다. "재밌겠다... 좀 놀아볼까?"',
    choicesByBackground: {
      '전직 경비원': [
        { text: '중력 왜곡을 무시하고 전력 돌진한다', category: 'physical', baseDC: 14 },
        { text: '떠오른 물건을 붙잡아 방패로 쓴다', category: 'defensive', baseDC: 14 },
        { text: '벽을 차고 뛰어올라 공중에서 공격한다', category: 'physical', baseDC: 15 },
      ],
      '요리사': [
        { text: '소금과 향신료를 마법진처럼 뿌린다', category: 'creative', baseDC: 13 },
        { text: '떠다니는 조리도구를 잡아 반격한다', category: 'creative', baseDC: 15 },
      ],
      '개발자': [
        { text: '차원 균열의 주파수를 분석해 닫으려 한다', category: 'technical', baseDC: 14 },
        { text: '마력 패턴의 규칙성을 찾아 역이용한다', category: 'technical', baseDC: 15 },
      ],
      '영업사원': [
        { text: '"더 재밌는 장소를 소개해 드릴까요?" 유인한다', category: 'social', baseDC: 14 },
        { text: '팀원들의 공포를 잠재우고 집중시킨다', category: 'social', baseDC: 13 },
      ],
    },
    defaultChoices: [
      { text: '떠다니는 물체를 무기 삼아 공격한다', category: 'physical', baseDC: 14 },
      { text: '팀원과 등을 맞대고 전방위를 방어한다', category: 'defensive', baseDC: 14 },
    ],
  },

  // ── Wave 19: 황금 자동인형 ──
  {
    enemy: {
      name: '황금 자동인형',
      description: '화려하지만 치명적인 황금 자동인형. 정교한 공격 패턴을 가졌다.',
      defense: 16,
      imageTag: 'gilded-automaton',
    },
    baseHp: 185,
    baseAttack: 24,
    situation: '폐관된 시계 박물관에 들어섰다. 유리 진열장 안의 황금 자동인형이 눈을 뜬다. 태엽 소리와 함께 우아하게 일어서더니 양팔에서 황금 칼날이 튀어나온다. 정교한 발레 동작으로 다가오지만 칼날은 무자비하다. "마지막 공연을... 시작하지..."',
    choicesByBackground: {
      '전직 경비원': [
        { text: '칼날 패턴 사이를 뚫고 태엽 부위를 공격한다', category: 'physical', baseDC: 14 },
        { text: '진열장 유리를 방패 삼아 칼날을 막는다', category: 'defensive', baseDC: 14 },
        { text: '두 번째 회전 뒤 빈틈을 노린다', category: 'physical', baseDC: 15 },
      ],
      '요리사': [
        { text: '관절에 기름을 부어 고착시킨다', category: 'creative', baseDC: 14 },
        { text: '진열장을 밀어 이동 경로를 막는다', category: 'creative', baseDC: 14 },
      ],
      '개발자': [
        { text: '태엽 메커니즘의 취약점을 분석한다', category: 'technical', baseDC: 13 },
        { text: '박물관 보안 시스템으로 전기 트랩을 만든다', category: 'technical', baseDC: 15 },
      ],
      '영업사원': [
        { text: '"관객이 더 필요하지 않으세요?" 시간을 번다', category: 'social', baseDC: 14 },
        { text: '팀원에게 패턴 공략 순서를 지시한다', category: 'social', baseDC: 13 },
      ],
    },
    defaultChoices: [
      { text: '태엽이 풀릴 때까지 피하며 버틴다', category: 'defensive', baseDC: 14 },
      { text: '진열장 잔해를 던져 공격한다', category: 'physical', baseDC: 14 },
    ],
  },

  // ── Wave 20 (최종보스): 공포의 수호자 ──
  {
    enemy: {
      name: '공포의 수호자',
      description: '거대한 갑옷이 길을 가로막는 수호자. 모든 공포가 실체화된 존재.',
      defense: 18,
      imageTag: 'dread-guardian',
    },
    baseHp: 220,
    baseAttack: 28,
    situation: '모든 것을 뚫고 야시장의 가장 깊은 곳에 도달했다. 거대한 문 앞에 갑옷의 수호자가 서 있다. 갑옷 틈새에서 어둠이 흘러나오고, 발밑에서 공포가 피어오른다. 일행의 가장 두려운 기억이 환영이 되어 나타난다. "여기가... 끝이다. 되돌아갈 수도... 앞으로 갈 수도... 없다."',
    choicesByBackground: {
      '전직 경비원': [
        { text: '공포를 이겨내고 전력으로 돌진한다', category: 'physical', baseDC: 14 },
        { text: '팀원들을 지키며 환영을 버텨낸다', category: 'defensive', baseDC: 13 },
        { text: '갑옷 투구의 틈을 노려 결정타를 날린다', category: 'physical', baseDC: 15 },
      ],
      '요리사': [
        { text: '마지막 재료로 최고의 요리를 만들어 팀을 회복시킨다', category: 'creative', baseDC: 13 },
        { text: '화염 공격으로 어둠을 태운다', category: 'creative', baseDC: 14 },
        { text: '갑옷 내부에 폭발물을 밀어넣는다', category: 'creative', baseDC: 15 },
      ],
      '개발자': [
        { text: '갑옷의 마력 순환 체계를 분석해 교란한다', category: 'technical', baseDC: 14 },
        { text: '환영의 주파수를 역추적해 차단한다', category: 'technical', baseDC: 15 },
      ],
      '영업사원': [
        { text: '팀 전원의 의지를 하나로 모으는 연설을 한다', category: 'social', baseDC: 12 },
        { text: '"당신의 공포도 결국 외로움이죠" 핵심을 찌른다', category: 'social', baseDC: 14 },
        { text: '"문 너머에 뭐가 있든, 우린 갈 겁니다" 선언한다', category: 'social', baseDC: 15 },
      ],
    },
    defaultChoices: [
      { text: '모두 합심해 최후의 돌격을 감행한다', category: 'physical', baseDC: 14 },
      { text: '공포에 맞서며 약점이 드러날 때까지 버틴다', category: 'defensive', baseDC: 13 },
    ],
  },
];

/**
 * 웨이브 번호에 해당하는 템플릿 반환 (레거시 — 항상 기본 적)
 * waveNumber: 1~10 (1-indexed)
 */
export function getWaveTemplate(waveNumber: number): WaveTemplate {
  const idx = Math.max(0, Math.min(waveNumber - 1, WAVE_TEMPLATES.length - 1));
  return WAVE_TEMPLATES[idx];
}

// ===== 웨이브 풀 (다양한 적) =====

export interface WavePool {
  variants: WaveTemplate[];
  isBoss: boolean;
}

/** 비보스 웨이브 변형 적 템플릿 */
const WAVE_VARIANTS: Record<number, WaveTemplate[]> = {
  // Wave 1 변형: 야시장 떠돌이 개
  1: [{
    enemy: { name: '야시장 떠돌이 개', description: '빨간 반다나를 두른 크고 사나운 개. 이빨을 드러내며 으르렁거린다.', defense: 3, imageTag: 'stray-dog' },
    baseHp: 45, baseAttack: 4,
    situation: '야시장 뒷골목. 쓰레기통 옆에 커다란 떠돌이 개가 앉아 있다. 빨간 반다나를 두르고 있는 걸 보니 누군가 키우다 버린 듯. 갑자기 이빨을 드러내며 달려든다!',
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트를 앞에 대고 막아선다', category: 'defensive', baseDC: 8 },
        { text: '큰 소리로 위협한다', category: 'physical', baseDC: 9 },
      ],
      '요리사': [
        { text: '남은 고기로 다른 곳에 유인한다', category: 'creative', baseDC: 8 },
        { text: '프라이팬을 땅에 쳐 소리를 낸다', category: 'creative', baseDC: 10 },
      ],
      '개발자': [
        { text: '초음파 앱을 튼다', category: 'technical', baseDC: 9 },
        { text: '가방을 방패처럼 든다', category: 'defensive', baseDC: 10 },
      ],
      '영업사원': [
        { text: '"착하지~ 착하지~" 달랜다', category: 'social', baseDC: 8 },
        { text: '서류 뭉치를 던져 주의를 끈다', category: 'creative', baseDC: 10 },
      ],
    },
    defaultChoices: [
      { text: '천천히 뒷걸음질 친다', category: 'defensive', baseDC: 8 },
      { text: '물건을 던져 주의를 돌린다', category: 'creative', baseDC: 9 },
    ],
  }],
  // Wave 2 변형: 폭주 신호등
  2: [{
    enemy: { name: '폭주 신호등', description: '세 눈이 동시에 켜진 미친 신호등. 팔을 휘두른다.', defense: 4, imageTag: 'traffic-light' },
    baseHp: 55, baseAttack: 5,
    situation: '교차로에 도착했는데 신호등이 이상하다. 빨강, 노랑, 초록이 동시에 번쩍이더니 기둥째로 일어선다! 방향 표지판 팔로 차를 쓸어버린다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '기둥 하단을 배트로 친다', category: 'physical', baseDC: 8 },
        { text: '전봇대 뒤로 숨어 접근한다', category: 'defensive', baseDC: 10 },
      ],
      '요리사': [
        { text: '양파를 던져 센서를 가린다', category: 'creative', baseDC: 9 },
        { text: '기름을 뿌려 미끄러뜨린다', category: 'creative', baseDC: 11 },
      ],
      '개발자': [
        { text: '제어박스를 찾아 전원을 끊는다', category: 'technical', baseDC: 8 },
        { text: '신호 프로토콜을 해킹한다', category: 'technical', baseDC: 11 },
      ],
      '영업사원': [
        { text: '"규정을 지켜야죠" 협상한다', category: 'social', baseDC: 9 },
        { text: '통행료 협상을 제안한다', category: 'social', baseDC: 11 },
      ],
    },
    defaultChoices: [
      { text: '돌멩이를 던져 주의를 끈다', category: 'creative', baseDC: 10 },
      { text: '뒤로 물러나 관찰한다', category: 'defensive', baseDC: 9 },
    ],
  }],
  // Wave 3 변형: 하수구 쥐떼
  3: [{
    enemy: { name: '하수구 쥐떼', description: '맨홀에서 쏟아져 나오는 빨간 눈의 쥐 무리.', defense: 5, imageTag: 'sewer-rats' },
    baseHp: 65, baseAttack: 7,
    situation: '맨홀 뚜껑이 덜컹거리더니 튕겨 나간다. 빨간 눈의 쥐 수십 마리가 파도처럼 밀려온다. 키이익 소리가 골목을 채운다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트로 바닥을 쳐서 진동으로 흩뜨린다', category: 'physical', baseDC: 10 },
        { text: '높은 곳으로 올라간다', category: 'defensive', baseDC: 11 },
      ],
      '요리사': [
        { text: '고추가루를 뿌려 쥐떼를 멈춘다', category: 'creative', baseDC: 9 },
        { text: '치즈로 다른 방향에 유인한다', category: 'creative', baseDC: 12 },
      ],
      '개발자': [
        { text: '폰 플래시를 스트로보로 설정한다', category: 'technical', baseDC: 10 },
        { text: '보조배터리를 물웅덩이에 떨어뜨린다', category: 'technical', baseDC: 12 },
      ],
      '영업사원': [
        { text: '"쥐 퇴치 서비스 있습니다!" 허세를 부린다', category: 'social', baseDC: 10 },
        { text: '큰 소리로 노래를 불러 혼란을 준다', category: 'social', baseDC: 12 },
      ],
    },
    defaultChoices: [
      { text: '물건을 던져 길을 만든다', category: 'physical', baseDC: 11 },
      { text: '담장 위로 올라간다', category: 'defensive', baseDC: 10 },
    ],
  }],
  // Wave 4 변형: 폭주 쇼핑카트
  4: [{
    enemy: { name: '폭주 쇼핑카트', description: '물건이 가득 찬 카트가 빨간 눈으로 돌진한다.', defense: 6, imageTag: 'shopping-cart' },
    baseHp: 75, baseAttack: 9,
    situation: '마트 주차장을 지나는데 쇼핑카트가 저절로 움직인다. 안에 물건이 잔뜩 쌓여 있고 빨간 불이 켜진다. 바퀴가 미친 듯이 돌며 돌진해온다!',
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트로 바퀴를 노린다', category: 'physical', baseDC: 10 },
        { text: '차 뒤에 숨어 지나가게 한다', category: 'defensive', baseDC: 11 },
        { text: '전력 질주로 옆에서 밀어 넘긴다', category: 'physical', baseDC: 13 },
      ],
      '요리사': [
        { text: '바닥에 기름을 뿌려 방향을 틀게 한다', category: 'creative', baseDC: 10 },
        { text: '물건을 빼서 가볍게 만든다', category: 'creative', baseDC: 12 },
      ],
      '개발자': [
        { text: '주차 차단기를 해킹해 가로막는다', category: 'technical', baseDC: 10 },
        { text: '전자 잠금장치로 바퀴를 잠근다', category: 'technical', baseDC: 13 },
      ],
      '영업사원': [
        { text: '"영수증 확인 좀!" 혼란을 준다', category: 'social', baseDC: 11 },
        { text: '"반품 처리 해드릴게요" 달랜다', category: 'social', baseDC: 13 },
      ],
    },
    defaultChoices: [
      { text: '옆으로 뛰어 피한다', category: 'defensive', baseDC: 10 },
      { text: '벽으로 유인해서 부딪치게 한다', category: 'creative', baseDC: 11 },
    ],
  }],
  // Wave 6 변형: 폭주 포장마차
  6: [{
    enemy: { name: '폭주 포장마차', description: '불타는 포장마차가 바퀴 달린 채로 돌진한다.', defense: 7, imageTag: 'food-cart' },
    baseHp: 85, baseAttack: 10,
    situation: '야시장 대로에서 포장마차 하나가 불을 뿜으며 돌진해온다! 뜨거운 국물이 사방에 튀고 천막에 불이 붙었다. "오늘의 메뉴는... 너희다!"',
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트로 바퀴를 부순다', category: 'physical', baseDC: 10 },
        { text: '소화기를 찾아 불을 끈다', category: 'defensive', baseDC: 11 },
      ],
      '요리사': [
        { text: '냄비를 빼앗아 무기로 쓴다', category: 'creative', baseDC: 10 },
        { text: '물을 끼얹어 불을 끈다', category: 'creative', baseDC: 12 },
      ],
      '개발자': [
        { text: '가스 밸브를 잠근다', category: 'technical', baseDC: 10 },
        { text: '전기 회로를 단락시킨다', category: 'technical', baseDC: 13 },
      ],
      '영업사원': [
        { text: '"위생 점검이요!" 위협한다', category: 'social', baseDC: 10 },
        { text: '"맛집 리뷰 써드릴게요" 달랜다', category: 'social', baseDC: 12 },
      ],
    },
    defaultChoices: [
      { text: '옆으로 뛰어 피한다', category: 'defensive', baseDC: 10 },
      { text: '물건을 던져 방향을 틀게 한다', category: 'creative', baseDC: 11 },
    ],
  }],
  // Wave 7 변형: 우산 요괴
  7: [{
    enemy: { name: '버려진 우산 요괴', description: '한쪽 다리로 폴짝거리는 보라색 우산. 눈이 빨갛다.', defense: 8, imageTag: 'umbrella-ghost' },
    baseHp: 95, baseAttack: 11,
    situation: '비가 내리기 시작한다. 버려진 우산 하나가 저절로 펼쳐지더니 한쪽 다리로 일어선다. 빨간 눈이 번쩍이고 긴 혀를 내민다. 뒤에서 우산 여러 개가 더 펼쳐진다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트로 우산살을 부순다', category: 'physical', baseDC: 11 },
        { text: '지붕 아래로 숨어 유인한다', category: 'defensive', baseDC: 12 },
      ],
      '요리사': [
        { text: '뜨거운 물을 끼얹는다', category: 'creative', baseDC: 11 },
        { text: '바람에 날려보낸다', category: 'creative', baseDC: 13 },
      ],
      '개발자': [
        { text: '에어컨 실외기 바람을 이용한다', category: 'technical', baseDC: 11 },
        { text: '자동문을 이용해 가둔다', category: 'technical', baseDC: 13 },
      ],
      '영업사원': [
        { text: '"비 올 때 우산이 뭘 더 원해요" 달랜다', category: 'social', baseDC: 11 },
        { text: '새 주인을 찾아주겠다고 설득한다', category: 'social', baseDC: 14 },
      ],
    },
    defaultChoices: [
      { text: '건물 안으로 도망친다', category: 'defensive', baseDC: 11 },
      { text: '나뭇가지로 우산을 잡는다', category: 'physical', baseDC: 12 },
    ],
  }],
  // Wave 8 변형: 고장난 TV
  8: [{
    enemy: { name: '고장난 브라운관 TV', description: '정전기를 뿜으며 걸어다니는 구형 TV. 화면에 눈이 보인다.', defense: 9, imageTag: 'broken-tv' },
    baseHp: 105, baseAttack: 12,
    situation: '전자상가 폐허에 들어섰다. 구석에 쌓인 구형 TV 한 대가 갑자기 켜진다. 화면에 눈 두 개가 나타나더니 정전기를 뿜으며 안테나 다리로 일어선다. "치지직... 시청률... 올려야 해..."',
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트로 화면을 깨부순다', category: 'physical', baseDC: 12 },
        { text: '고무장갑을 끼고 접근한다', category: 'defensive', baseDC: 13 },
      ],
      '요리사': [
        { text: '물을 뿌려 합선시킨다', category: 'creative', baseDC: 11 },
        { text: '알루미늄 호일로 안테나를 감싼다', category: 'creative', baseDC: 14 },
      ],
      '개발자': [
        { text: '리모컨을 찾아 전원을 끈다', category: 'technical', baseDC: 11 },
        { text: '전파 간섭으로 화면을 교란한다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"요즘은 스마트 TV 시대에요" 설득한다', category: 'social', baseDC: 12 },
        { text: '재활용 수거 서비스를 제안한다', category: 'social', baseDC: 14 },
      ],
    },
    defaultChoices: [
      { text: '전원 콘센트를 뽑는다', category: 'technical', baseDC: 12 },
      { text: '건물 밖으로 유인한다', category: 'defensive', baseDC: 12 },
    ],
  }],
  // Wave 9 변형: 변이 전봇대
  9: [{
    enemy: { name: '변이 전봇대', description: '전선을 촉수처럼 휘두르는 전봇대. 스파크가 튄다.', defense: 10, imageTag: 'electric-pole' },
    baseHp: 115, baseAttack: 14,
    situation: '큰길에 나서자 전봇대 하나가 꿈틀거린다. 전선이 촉수처럼 풀리며 사방을 휘젓는다. 아스팔트에 불꽃이 튀고, 가로등이 연쇄적으로 터진다!',
    choicesByBackground: {
      '전직 경비원': [
        { text: '고무장갑을 끼고 전선을 잡는다', category: 'physical', baseDC: 12 },
        { text: '비금속 방패로 방어한다', category: 'defensive', baseDC: 13 },
        { text: '기둥 하단을 공격한다', category: 'physical', baseDC: 14 },
      ],
      '요리사': [
        { text: '물웅덩이를 피해 접근한다', category: 'creative', baseDC: 12 },
        { text: '나무 도마를 방패로 쓴다', category: 'creative', baseDC: 14 },
      ],
      '개발자': [
        { text: '변전소 차단기를 찾아 내린다', category: 'technical', baseDC: 12 },
        { text: '전력망을 해킹해 차단한다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"한전에 민원 넣겠습니다!" 위협한다', category: 'social', baseDC: 12 },
        { text: '동료들의 사기를 끌어올린다', category: 'social', baseDC: 15 },
      ],
    },
    defaultChoices: [
      { text: '안전 거리에서 물건을 던진다', category: 'creative', baseDC: 12 },
      { text: '팀원과 합심해 기둥을 밀어낸다', category: 'physical', baseDC: 13 },
    ],
  }],
  // Wave 11 변형: 칼날 구체
  11: [{
    enemy: { name: '칼날 구체', description: '회전하며 모든 것을 베는 칼날 구체. 제어 불능이다.', defense: 10, imageTag: 'blade-sphere' },
    baseHp: 120, baseAttack: 15,
    situation: '폐공장 통로에서 윙윙거리는 소리가 들린다. 회전하는 칼날 구체가 벽을 긁으며 다가온다! 지나간 자리에 깊은 흠집이 패인다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '타이밍을 맞춰 배트로 쳐낸다', category: 'physical', baseDC: 12 },
        { text: '두꺼운 철판 뒤에 숨는다', category: 'defensive', baseDC: 13 },
      ],
      '요리사': [
        { text: '기름을 뿌려 회전을 방해한다', category: 'creative', baseDC: 12 },
        { text: '금속 쟁반으로 궤도를 바꾼다', category: 'creative', baseDC: 14 },
      ],
      '개발자': [
        { text: '전자기 간섭으로 제어 회로를 마비시킨다', category: 'technical', baseDC: 11 },
        { text: '공장 자석을 이용해 구체를 붙잡는다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"리콜 대상 제품입니다!" 큰 소리를 낸다', category: 'social', baseDC: 12 },
        { text: '팀원에게 교대 회피 작전을 지시한다', category: 'social', baseDC: 13 },
      ],
    },
    defaultChoices: [
      { text: '좁은 틈으로 유인해 끼게 만든다', category: 'creative', baseDC: 12 },
      { text: '장애물 뒤에서 반격 기회를 노린다', category: 'defensive', baseDC: 12 },
    ],
  }],
  // Wave 12 변형: 불꽃 원령
  12: [{
    enemy: { name: '불꽃 원령', description: '불꽃 원령. 닿으면 모든 것이 타오른다.', defense: 11, imageTag: 'flame-wraith' },
    baseHp: 130, baseAttack: 16,
    situation: '폐건물 복도에 갑자기 온도가 치솟는다. 벽에 걸린 달력이 저절로 타오르며 불꽃의 형체가 나타난다. 주변 공기가 일렁이고 숨 쉬기가 힘들어진다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '소화기를 찾아 분사한다', category: 'physical', baseDC: 13 },
        { text: '불이 닿지 않는 곳으로 유인한다', category: 'defensive', baseDC: 12 },
      ],
      '요리사': [
        { text: '대량의 물을 끼얹어 약화시킨다', category: 'creative', baseDC: 12 },
        { text: '모래와 소금을 뿌려 불길을 잡는다', category: 'creative', baseDC: 14 },
      ],
      '개발자': [
        { text: '스프링클러 시스템을 해킹해 작동시킨다', category: 'technical', baseDC: 12 },
        { text: '환풍기를 역회전시켜 산소를 차단한다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"화재보험 들었나요?" 도발한다', category: 'social', baseDC: 13 },
        { text: '팀원에게 물 공격을 집중하자고 지시한다', category: 'social', baseDC: 12 },
      ],
    },
    defaultChoices: [
      { text: '물과 모래를 이용해 약화시킨다', category: 'creative', baseDC: 12 },
      { text: '불길을 피해 안전지대를 확보한다', category: 'defensive', baseDC: 13 },
    ],
  }],
  // Wave 13 변형: 에메랄드 기사
  13: [{
    enemy: { name: '에메랄드 기사', description: '에메랄드 기사. 창과 방패로 무장한 정예 전사.', defense: 12, imageTag: 'emerald-knight' },
    baseHp: 140, baseAttack: 18,
    situation: '야시장 뒤편 광장에 녹색 갑옷의 기사가 창을 세우고 서 있다. "이 길을 지나려면... 나를 이겨라." 방패에 박힌 에메랄드가 초록빛으로 빛난다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트로 방패를 밀어내고 빈틈을 노린다', category: 'physical', baseDC: 13 },
        { text: '창 공격을 흘려보내며 카운터를 노린다', category: 'defensive', baseDC: 13 },
      ],
      '요리사': [
        { text: '기름을 바닥에 뿌려 발을 미끄럽게 한다', category: 'creative', baseDC: 12 },
        { text: '향신료 가루를 투구 안에 날린다', category: 'creative', baseDC: 14 },
      ],
      '개발자': [
        { text: '에메랄드의 에너지원을 분석해 교란한다', category: 'technical', baseDC: 12 },
        { text: '갑옷 관절의 구조적 약점을 파악한다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"정정당당한 결투를 원하시는 건가요" 시간을 번다', category: 'social', baseDC: 13 },
        { text: '팀원들에게 측면 포위를 지시한다', category: 'social', baseDC: 12 },
      ],
    },
    defaultChoices: [
      { text: '여럿이서 동시에 공격한다', category: 'physical', baseDC: 13 },
      { text: '주변 지형을 이용해 방어전을 편다', category: 'defensive', baseDC: 13 },
    ],
  }],
  // Wave 14 변형: 크라켄의 자식
  14: [{
    enemy: { name: '크라켄의 자식', description: '촉수가 사방으로 뻗는 크라켄의 자식. 물가에서 힘이 세다.', defense: 13, imageTag: 'kraken-spawn' },
    baseHp: 150, baseAttack: 19,
    situation: '하천 옆을 지나는데 물속에서 거대한 촉수가 솟아오른다! 크라켄의 자식이 수면 위로 몸을 드러낸다. 촉수 열 개가 동시에 휘둘러지며 다리 난간을 부순다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '촉수를 잘라내며 몸통에 접근한다', category: 'physical', baseDC: 13 },
        { text: '다리 구조물을 방패로 활용한다', category: 'defensive', baseDC: 14 },
      ],
      '요리사': [
        { text: '뜨거운 기름을 촉수에 끼얹는다', category: 'creative', baseDC: 13 },
        { text: '소금을 대량으로 뿌려 수축시킨다', category: 'creative', baseDC: 14 },
      ],
      '개발자': [
        { text: '하천 수문을 해킹해 수위를 낮춘다', category: 'technical', baseDC: 13 },
        { text: '전기 장치를 물에 떨어뜨려 감전시킨다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"바다로 돌아가면 더 좋을 텐데요" 설득한다', category: 'social', baseDC: 13 },
        { text: '팀원에게 촉수 하나씩 맡으라고 지시한다', category: 'social', baseDC: 12 },
      ],
    },
    defaultChoices: [
      { text: '물에서 멀리 유인해 약화시킨다', category: 'creative', baseDC: 13 },
      { text: '높은 곳으로 올라가 촉수를 피한다', category: 'defensive', baseDC: 13 },
    ],
  }],
  // Wave 16 변형: 고대 미라
  16: [{
    enemy: { name: '고대 미라', description: '고대 미라. 붕대 사이로 저주가 스며든다.', defense: 13, imageTag: 'elder-mummy' },
    baseHp: 155, baseAttack: 20,
    situation: '폐건물 지하에서 석관 하나가 열린다. 고대 미라가 붕대를 풀며 일어선다. 붕대 틈에서 보라색 저주의 기운이 피어오르고, 미라의 눈이 금빛으로 빛난다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '붕대를 잡아 풀어버린다', category: 'physical', baseDC: 13 },
        { text: '저주의 기운을 피하며 거리를 유지한다', category: 'defensive', baseDC: 13 },
      ],
      '요리사': [
        { text: '불을 붙여 붕대를 태운다', category: 'creative', baseDC: 13 },
        { text: '소금을 뿌려 저주를 정화한다', category: 'creative', baseDC: 14 },
      ],
      '개발자': [
        { text: '저주 패턴의 규칙성을 분석한다', category: 'technical', baseDC: 13 },
        { text: '자외선 장치로 미라를 약화시킨다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"성불하세요, 이 세상은 많이 바뀌었어요" 진심으로 말한다', category: 'social', baseDC: 13 },
        { text: '팀원에게 붕대 공격을 집중하자고 지시한다', category: 'social', baseDC: 13 },
      ],
    },
    defaultChoices: [
      { text: '불을 이용해 붕대를 태운다', category: 'creative', baseDC: 13 },
      { text: '저주의 범위 밖에서 원거리 공격한다', category: 'defensive', baseDC: 13 },
    ],
  }],
  // Wave 17 변형: 거대 파리지옥
  17: [{
    enemy: { name: '거대 파리지옥', description: '거대 파리지옥. 벌린 입이 사람을 삼킬 만큼 크다.', defense: 14, imageTag: 'venus-trap' },
    baseHp: 165, baseAttack: 21,
    situation: '공원 화단에서 거대한 파리지옥이 자라났다. 세 개의 머리가 동시에 입을 벌리고 산성 침을 뿜는다. 뿌리가 땅을 뒤흔들며 도망치는 것도 쉽지 않다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '줄기를 배트로 내리쳐 머리를 끊는다', category: 'physical', baseDC: 14 },
        { text: '산성 침을 피하며 뿌리 쪽으로 접근한다', category: 'defensive', baseDC: 13 },
      ],
      '요리사': [
        { text: '불과 기름으로 줄기를 태운다', category: 'creative', baseDC: 13 },
        { text: '강한 냄새의 음식으로 머리를 유인한다', category: 'creative', baseDC: 15 },
      ],
      '개발자': [
        { text: '식물의 감각 체계를 교란시킨다', category: 'technical', baseDC: 13 },
        { text: '공원 관리 시스템에서 제초 장비를 기동한다', category: 'technical', baseDC: 14 },
      ],
      '영업사원': [
        { text: '"식물원에 취직 알선해 드릴게요" 주의를 끈다', category: 'social', baseDC: 14 },
        { text: '팀원에게 머리 하나씩 맡자고 지시한다', category: 'social', baseDC: 13 },
      ],
    },
    defaultChoices: [
      { text: '불을 이용해 줄기를 공격한다', category: 'creative', baseDC: 13 },
      { text: '산성 침의 범위 밖에서 공략한다', category: 'defensive', baseDC: 14 },
    ],
  }],
  // Wave 18 변형: 쇠갑충
  18: [{
    enemy: { name: '쇠갑충', description: '철갑 같은 등껍질에 거대한 뿔을 가진 쇠갑충. 돌진이 강력하다.', defense: 15, imageTag: 'iron-stag-beetle' },
    baseHp: 175, baseAttack: 23,
    situation: '폐차장에서 거대한 갑충이 금속 더미를 뚫고 나온다. 강철보다 단단한 등껍질이 가로등 빛에 번쩍이고, 거대한 뿔로 차를 들이받으며 전진한다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '뿔 사이를 노려 배에 공격을 집중한다', category: 'physical', baseDC: 14 },
        { text: '폐차를 방패 삼아 돌진을 막는다', category: 'defensive', baseDC: 14 },
      ],
      '요리사': [
        { text: '뒤집어지면 약하다는 점을 노린다', category: 'creative', baseDC: 13 },
        { text: '기름을 바닥에 뿌려 미끄러뜨린다', category: 'creative', baseDC: 15 },
      ],
      '개발자': [
        { text: '폐차장 크레인을 해킹해 뒤집어 놓는다', category: 'technical', baseDC: 14 },
        { text: '등껍질 틈새의 약점을 스캔한다', category: 'technical', baseDC: 15 },
      ],
      '영업사원': [
        { text: '"곤충 도감에 실어드릴까요?" 주의를 끈다', category: 'social', baseDC: 14 },
        { text: '팀원에게 측면 공격을 지시한다', category: 'social', baseDC: 13 },
      ],
    },
    defaultChoices: [
      { text: '등껍질 아래를 노려 공격한다', category: 'physical', baseDC: 14 },
      { text: '돌진을 유도해 벽에 부딪치게 한다', category: 'creative', baseDC: 14 },
    ],
  }],
  // Wave 19 변형: 타이탄 딱정벌레
  19: [{
    enemy: { name: '타이탄 딱정벌레', description: '거대 딱정벌레. 등껍질이 강철보다 단단하다.', defense: 16, imageTag: 'titan-beetle' },
    baseHp: 185, baseAttack: 24,
    situation: '박물관 뒤편 정원에서 땅이 갈라지며 거대 딱정벌레가 솟아오른다. 등껍질에 이끼가 덮여 있어 얼마나 오래 잠들어 있었는지 짐작된다. 턱이 벌어지며 포효한다.',
    choicesByBackground: {
      '전직 경비원': [
        { text: '턱 아래 부드러운 부분을 집중 공격한다', category: 'physical', baseDC: 14 },
        { text: '등껍질 위로 올라가 안전지대를 확보한다', category: 'defensive', baseDC: 14 },
      ],
      '요리사': [
        { text: '산성 양념을 등껍질에 부어 부식시킨다', category: 'creative', baseDC: 14 },
        { text: '뒤집어지면 일어나지 못하게 한다', category: 'creative', baseDC: 14 },
      ],
      '개발자': [
        { text: '등껍질의 구조적 약점을 계산한다', category: 'technical', baseDC: 13 },
        { text: '지하 파이프라인을 터뜨려 물로 밀어낸다', category: 'technical', baseDC: 15 },
      ],
      '영업사원': [
        { text: '"자연사 박물관에서 모셔가실 겁니다" 달랜다', category: 'social', baseDC: 14 },
        { text: '팀원 전원 동시 공격을 카운트한다', category: 'social', baseDC: 13 },
      ],
    },
    defaultChoices: [
      { text: '뒤집어지게 유도한 뒤 약점을 공격한다', category: 'creative', baseDC: 14 },
      { text: '단단한 등껍질을 피해 측면에서 공격한다', category: 'physical', baseDC: 14 },
    ],
  }],
};

/**
 * 웨이브 풀: 비보스 웨이브는 [기본 + 변형] 풀, 보스 웨이브는 단일 고정
 */
export const WAVE_POOLS: WavePool[] = WAVE_TEMPLATES.map((base, idx) => {
  const waveNumber = idx + 1;
  const isBoss = waveNumber % 5 === 0;
  const variants = WAVE_VARIANTS[waveNumber];
  return {
    isBoss,
    variants: isBoss || !variants ? [base] : [base, ...variants],
  };
});

/**
 * 시드 기반 웨이브 풀에서 템플릿 선택
 * - 보스 웨이브: 항상 기본 적
 * - 비보스 웨이브: 시드로 결정적 선택, 시드 없으면 랜덤
 */
export function getWaveTemplateFromPool(
  waveNumber: number,
  pick?: <T>(arr: T[]) => T,
): WaveTemplate {
  const pools = _getExpandedPools();
  const idx = Math.max(0, Math.min(waveNumber - 1, pools.length - 1));
  const pool = pools[idx];

  if (pool.isBoss || pool.variants.length === 1) {
    return pool.variants[0];
  }

  if (pick) {
    return pick(pool.variants);
  }

  return pool.variants[Math.floor(Math.random() * pool.variants.length)];
}

// ===== 적 스케일링 =====

/**
 * 인원수에 따라 적 스탯 조정
 */
export function scaleEnemy(template: WaveTemplate, playerCount: number): Enemy {
  const scale = GAME_CONSTANTS.DIFFICULTY_SCALE[playerCount as keyof typeof GAME_CONSTANTS.DIFFICULTY_SCALE]
    ?? GAME_CONSTANTS.DIFFICULTY_SCALE[4];

  const hp = Math.floor(template.baseHp * scale.hpMod);

  return {
    ...template.enemy,
    hp,
    maxHp: hp,
    attack: Math.floor(template.baseAttack * scale.atkMod),
  };
}

// ===== 내러티브 템플릿 =====

const NARRATIVE_TEMPLATES: Record<RollTier, string[]> = {
  nat20: [
    '{name}의 {choice}이(가) 전설적으로 성공했다! 주변이 눈부신 빛으로 가득 찬다.',
    '{name}, 믿을 수 없는 행운! {choice} — 적이 크게 흔들린다!',
    '★ CRITICAL HIT! {name}의 {choice}에 적이 비틀거린다!',
  ],
  critical: [
    '{name}의 {choice}이(가) 훌륭하게 성공했다. 적이 타격을 입었다.',
    '{name}, 멋진 판단이었다! {choice}로 확실한 데미지를 입혔다.',
  ],
  normal: [
    '{name}이(가) {choice}을(를) 시도했다. 그럭저럭 효과가 있었다.',
    '{name}의 {choice}, 나쁘지 않은 결과다. 적에게 데미지를 주었지만 반격도 받았다.',
  ],
  fail: [
    '{name}의 {choice}이(가) 실패했다... 적의 반격이 날아온다.',
    '{name}, {choice}을(를) 시도했지만 빗나갔다. 아야.',
  ],
  nat1: [
    '{name}이(가) {choice}을(를) 시도하다가 넘어졌다! 적이 놓치지 않는다!',
    '★ FUMBLE! {name}의 {choice}이(가) 완전히 엉망이 됐다. 모두가 얼굴을 감쌌다.',
  ],
};

/**
 * 4명의 행동으로 내러티브 텍스트 생성
 */
export function buildNarrative(actions: import('@round-midnight/shared').PlayerAction[], enemyName: string, enemyDefeated: boolean): string {
  const lines: string[] = [];

  for (const action of actions) {
    const templates = NARRATIVE_TEMPLATES[action.tier];
    const template = templates[Math.floor(Math.random() * templates.length)];
    lines.push(
      template
        .replace('{name}', action.playerName)
        .replace('{choice}', action.choiceText)
    );
  }

  if (enemyDefeated) {
    lines.push('', `${enemyName}이(가) 쓰러졌다! 승리!`);
  } else {
    lines.push('', `${enemyName}은(는) 아직 건재하다...`);
  }

  return lines.join('\n');
}

// ===== 전리품 테이블 =====

export const LOOT_TABLE: LootItem[] = [
  { itemId: 'energy_drink', name: '수상한 에너지 드링크', type: 'consumable', rarity: 'common', description: '마시면 기운이 솟는다', effect: 'HP 15 회복' },
  { itemId: 'rusty_pipe', name: '녹슨 파이프', type: 'weapon', rarity: 'common', description: '꽤 묵직하다', effect: '물리 보정 +1' },
  { itemId: 'cardboard_armor', name: '골판지 갑옷', type: 'top', rarity: 'common', description: '누군가 정성 들여 만든 골판지 갑옷', effect: '방어 보정 +1' },
  { itemId: 'pocket_calculator', name: '주머니 계산기', type: 'accessory', rarity: 'common', description: '빠른 계산은 생존의 기본', effect: '기술 행동 DC -1' },
  { itemId: 'tteokbokki_cup', name: '컵 떡볶이', type: 'consumable', rarity: 'common', description: '매운맛이 정신을 차리게 한다', effect: 'HP 20 회복' },
  { itemId: 'construction_vest', name: '안전 조끼', type: 'top', rarity: 'uncommon', description: '반사 스트라이프가 어둠 속에서 빛난다', effect: '방어 보정 +2' },
  { itemId: 'friendship_bracelet', name: '우정 팔찌', type: 'accessory', rarity: 'common', description: '친구가 만들어준 팔찌', effect: '사회 행동 DC -1' },
  { itemId: 'hotdog_fresh', name: '수제 핫도그', type: 'consumable', rarity: 'common', description: '아직 따뜻하다', effect: 'HP 15 회복' },
  { itemId: 'mystery_can', name: '미스터리 캔', type: 'consumable', rarity: 'common', description: '라벨이 벗겨져 있다', effect: 'HP 25 회복' },
  { itemId: 'rabbit_foot_keychain', name: '토끼발 열쇠고리', type: 'accessory', rarity: 'common', description: '행운의 상징', effect: '주사위 리롤 1회' },
];

// ===== 다음 웨이브 미리보기 =====

export const NEXT_WAVE_PREVIEWS: string[] = [
  '더 깊은 곳에서 기계음이 들린다...',
  '그림자가 점점 짙어진다...',
  '지면이 미세하게 흔들리고 있다...',
  '어디선가 으르렁거리는 소리가...',               // Wave 1 끝 → 2 예고
  '⚠ 야시장의 진짜 주인이 오고 있다...',           // Wave 4 끝 → 5(보스) 예고
  '도로 너머에서 배달 오토바이 소리가...',          // Wave 5 끝 → 6 예고
  '지하에서 딸깍딸깍 관절 소리가...',              // Wave 6 끝 → 7 예고
  '간판 글씨들이 희미하게 떨리고 있다...',          // Wave 7 끝 → 8 예고
  '옥상에서 이상한 주파수가 들린다...',             // Wave 8 끝 → 9 예고
  '⚠ 시계탑의 종소리가 울려 퍼진다... 자정이 다가온다.',  // Wave 9 끝 → 10(보스) 예고
  '폐공장 안쪽에서 금속 긁는 소리가...',            // Wave 10 끝 → 11 예고
  '하늘이 점점 어두워지고 있다...',                // Wave 11 끝 → 12 예고
  '다리 아래에서 무거운 발소리가...',               // Wave 12 끝 → 13 예고
  '하천에서 기묘한 물결이 일렁인다...',             // Wave 13 끝 → 14 예고
  '⚠ 금빛이 지평선에서 번쩍인다... 거인이 깨어난다.',    // Wave 14 끝 → 15(보스) 예고
  '균열에서 열기가 피어오른다...',                  // Wave 15 끝 → 16 예고
  '공원의 나무들이 속삭이고 있다...',               // Wave 16 끝 → 17 예고
  '차원의 균열이 허공에 나타났다...',               // Wave 17 끝 → 18 예고
  '박물관 깊은 곳에서 태엽 소리가...',              // Wave 18 끝 → 19 예고
  '⚠ 최후의 문 앞에서 어둠이 실체화되고 있다...',        // Wave 19 끝 → 20(최종보스) 예고
];

// ===== 카테고리별 제네릭 상황 템플릿 (레지스트리 몬스터 폴백용) =====

interface CategoryTemplate {
  situations: string[];
  choicesByBackground: Record<string, ChoiceOptionTemplate[]>;
  defaultChoices: ChoiceOptionTemplate[];
}

// TODO(human): 카테고리 템플릿 — animal을 참고하여 나머지 7개 카테고리를 완성해주세요
export const CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
  animal: {
    situations: [
      '야시장 골목에서 {name}(이)가 갑자기 나타났다! {description}',
      '어두운 길모퉁이를 돌자 {name}(이)가 길을 막고 있다. {description}',
      '쓰레기통 뒤에서 {name}(이)가 튀어나왔다! {description}',
    ],
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트를 휘두르며 위협한다', category: 'physical', baseDC: 10 },
        { text: '방어 자세를 취하며 대치한다', category: 'defensive', baseDC: 10 },
      ],
      '요리사': [
        { text: '음식으로 다른 곳에 유인한다', category: 'creative', baseDC: 10 },
        { text: '프라이팬으로 위협한다', category: 'physical', baseDC: 11 },
      ],
      '개발자': [
        { text: '스마트폰 소리로 주의를 끈다', category: 'technical', baseDC: 10 },
        { text: '가방을 방패처럼 든다', category: 'defensive', baseDC: 11 },
      ],
      '영업사원': [
        { text: '차분하게 달래본다', category: 'social', baseDC: 10 },
        { text: '큰 소리로 위협한다', category: 'physical', baseDC: 11 },
      ],
    },
    defaultChoices: [
      { text: '소리를 질러 위협한다', category: 'physical', baseDC: 10 },
      { text: '천천히 뒤로 물러난다', category: 'defensive', baseDC: 10 },
    ],
  },
  humanoid: {
    situations: [
      '야시장 한가운데서 {name}(이)가 시비를 건다. {description}',
      '어두운 골목에서 {name}(이)가 나타나 길을 막는다. {description}',
    ],
    choicesByBackground: {
      '전직 경비원': [
        { text: '정면으로 맞서 싸운다', category: 'physical', baseDC: 10 },
        { text: '방어 자세로 약점을 노린다', category: 'defensive', baseDC: 11 },
      ],
      '요리사': [
        { text: '뜨거운 요리를 무기로 쓴다', category: 'creative', baseDC: 10 },
        { text: '칼솜씨로 위협한다', category: 'physical', baseDC: 11 },
      ],
      '개발자': [
        { text: '전자기기로 교란한다', category: 'technical', baseDC: 10 },
        { text: '약점을 분석해 공략한다', category: 'technical', baseDC: 12 },
      ],
      '영업사원': [
        { text: '협상을 시도한다', category: 'social', baseDC: 10 },
        { text: '심리전으로 혼란을 준다', category: 'social', baseDC: 11 },
      ],
    },
    defaultChoices: [
      { text: '물건을 던져 공격한다', category: 'physical', baseDC: 10 },
      { text: '주변 환경을 이용해 대응한다', category: 'creative', baseDC: 11 },
    ],
  },
  machine: {
    situations: [
      '폭주하는 {name}(이)가 길을 가로막는다! {description}',
      '갑자기 {name}(이)가 작동하기 시작했다. 빨간 눈이 번쩍인다! {description}',
    ],
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트로 핵심 부위를 노린다', category: 'physical', baseDC: 10 },
        { text: '장애물 뒤로 숨어 접근한다', category: 'defensive', baseDC: 11 },
      ],
      '요리사': [
        { text: '기름을 뿌려 미끄러뜨린다', category: 'creative', baseDC: 10 },
        { text: '물을 끼얹어 합선시킨다', category: 'creative', baseDC: 11 },
      ],
      '개발자': [
        { text: '전원부를 찾아 차단한다', category: 'technical', baseDC: 9 },
        { text: '제어 시스템을 해킹한다', category: 'technical', baseDC: 12 },
      ],
      '영업사원': [
        { text: '"고장 신고 접수했습니다" 달랜다', category: 'social', baseDC: 11 },
        { text: '주의를 끌어 다른 곳으로 유인한다', category: 'creative', baseDC: 10 },
      ],
    },
    defaultChoices: [
      { text: '전원 코드를 찾아 뽑는다', category: 'technical', baseDC: 10 },
      { text: '벽으로 유인해 부딪치게 한다', category: 'creative', baseDC: 11 },
    ],
  },
  supernatural: {
    situations: [
      '어둠 속에서 {name}(이)가 나타났다! 기이한 기운이 감돈다. {description}',
      '형광등이 깜빡이더니 {name}(이)가 모습을 드러냈다. {description}',
    ],
    choicesByBackground: {
      '전직 경비원': [
        { text: '두려움을 이기고 돌진한다', category: 'physical', baseDC: 11 },
        { text: '주변 물건으로 방어진을 친다', category: 'defensive', baseDC: 10 },
      ],
      '요리사': [
        { text: '소금을 뿌려 퇴마를 시도한다', category: 'creative', baseDC: 10 },
        { text: '강한 냄새로 혼란을 준다', category: 'creative', baseDC: 11 },
      ],
      '개발자': [
        { text: '강한 빛으로 약점을 찌른다', category: 'technical', baseDC: 10 },
        { text: '전자파로 실체를 교란한다', category: 'technical', baseDC: 12 },
      ],
      '영업사원': [
        { text: '"성불하세요" 진심으로 말한다', category: 'social', baseDC: 10 },
        { text: '동료들의 사기를 끌어올린다', category: 'social', baseDC: 11 },
      ],
    },
    defaultChoices: [
      { text: '밝은 곳으로 유인한다', category: 'creative', baseDC: 10 },
      { text: '무시하고 지나가려 한다', category: 'defensive', baseDC: 11 },
    ],
  },
  insect: {
    situations: [
      '거대한 {name}(이)가 다가온다! 불쾌한 소리를 낸다. {description}',
      '벽 틈에서 {name}(이)가 기어 나왔다! {description}',
    ],
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트로 내리친다', category: 'physical', baseDC: 10 },
        { text: '높은 곳으로 올라간다', category: 'defensive', baseDC: 10 },
      ],
      '요리사': [
        { text: '고추가루를 뿌린다', category: 'creative', baseDC: 10 },
        { text: '불로 위협한다', category: 'creative', baseDC: 11 },
      ],
      '개발자': [
        { text: '초음파 앱을 틀어 교란한다', category: 'technical', baseDC: 10 },
        { text: '플래시 스트로보로 혼란을 준다', category: 'technical', baseDC: 11 },
      ],
      '영업사원': [
        { text: '큰 소리로 위협한다', category: 'physical', baseDC: 10 },
        { text: '방충 스프레이를 찾는다', category: 'creative', baseDC: 11 },
      ],
    },
    defaultChoices: [
      { text: '물건을 던져 쫓는다', category: 'physical', baseDC: 10 },
      { text: '뒤로 물러나 관찰한다', category: 'defensive', baseDC: 10 },
    ],
  },
  plant: {
    situations: [
      '{name}(이)가 길을 가로막고 있다. 살아 움직이고 있다! {description}',
      '화단에서 {name}(이)가 갑자기 자라났다! {description}',
    ],
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트로 줄기를 쳐낸다', category: 'physical', baseDC: 10 },
        { text: '뿌리를 피해 우회한다', category: 'defensive', baseDC: 10 },
      ],
      '요리사': [
        { text: '칼로 가지를 정리한다', category: 'physical', baseDC: 10 },
        { text: '제초제 대용을 찾아 뿌린다', category: 'creative', baseDC: 11 },
      ],
      '개발자': [
        { text: '빛을 차단해 약화시킨다', category: 'technical', baseDC: 10 },
        { text: '약점 패턴을 분석한다', category: 'technical', baseDC: 11 },
      ],
      '영업사원': [
        { text: '불을 사용해 위협한다', category: 'creative', baseDC: 10 },
        { text: '다른 길을 찾자고 제안한다', category: 'social', baseDC: 11 },
      ],
    },
    defaultChoices: [
      { text: '불로 태운다', category: 'creative', baseDC: 10 },
      { text: '뿌리를 피해 돌아간다', category: 'defensive', baseDC: 10 },
    ],
  },
  blob: {
    situations: [
      '정체불명의 {name}(이)가 꿈틀거리고 있다! {description}',
      '바닥에서 {name}(이)가 스르르 나타났다. {description}',
    ],
    choicesByBackground: {
      '전직 경비원': [
        { text: '배트로 내려친다', category: 'physical', baseDC: 10 },
        { text: '닿지 않게 거리를 유지한다', category: 'defensive', baseDC: 10 },
      ],
      '요리사': [
        { text: '뜨거운 물을 끼얹는다', category: 'creative', baseDC: 10 },
        { text: '소금을 뿌려 수축시킨다', category: 'creative', baseDC: 11 },
      ],
      '개발자': [
        { text: '화학적 약점을 추론한다', category: 'technical', baseDC: 10 },
        { text: '전기 충격을 시도한다', category: 'technical', baseDC: 11 },
      ],
      '영업사원': [
        { text: '주의를 끌어 유인한다', category: 'social', baseDC: 10 },
        { text: '동료에게 협공을 제안한다', category: 'social', baseDC: 11 },
      ],
    },
    defaultChoices: [
      { text: '물건을 던져 반응을 본다', category: 'creative', baseDC: 10 },
      { text: '멀리서 관찰한다', category: 'defensive', baseDC: 10 },
    ],
  },
  boss: {
    situations: [
      '강대한 {name}(이)가 앞을 가로막는다! 압도적인 존재감이다. {description}',
    ],
    choicesByBackground: {
      '전직 경비원': [
        { text: '전력을 다해 돌진한다', category: 'physical', baseDC: 12 },
        { text: '동료를 지키며 방어진을 편다', category: 'defensive', baseDC: 12 },
      ],
      '요리사': [
        { text: '환경을 이용한 트랩을 설치한다', category: 'creative', baseDC: 12 },
        { text: '약점을 노린 기습을 시도한다', category: 'creative', baseDC: 13 },
      ],
      '개발자': [
        { text: '약점 패턴을 분석해 공략한다', category: 'technical', baseDC: 12 },
        { text: '주변 시스템을 해킹해 이용한다', category: 'technical', baseDC: 13 },
      ],
      '영업사원': [
        { text: '동료들의 사기를 끌어올린다', category: 'social', baseDC: 11 },
        { text: '협상을 시도한다', category: 'social', baseDC: 13 },
      ],
    },
    defaultChoices: [
      { text: '모두 합심해 공격한다', category: 'physical', baseDC: 12 },
      { text: '약점을 찾으며 버틴다', category: 'defensive', baseDC: 12 },
    ],
  },
};

// ===== 레지스트리 몬스터 → WaveTemplate 변환 =====

/**
 * 레지스트리의 MonsterEntry를 WaveTemplate으로 변환.
 * 카테고리별 제네릭 상황/선택지 사용.
 */
function buildTemplateFromRegistry(entry: MonsterEntry): WaveTemplate {
  const catTemplate = CATEGORY_TEMPLATES[entry.category] ?? CATEGORY_TEMPLATES.animal;

  // 상황 텍스트: 여러 변형 중 ID 기반으로 결정적 선택
  const sitIdx = entry.id % catTemplate.situations.length;
  const situation = catTemplate.situations[sitIdx]
    .replace('{name}', entry.name)
    .replace('{description}', entry.description);

  return {
    enemy: {
      name: entry.name,
      description: entry.description,
      defense: entry.defense,
      imageTag: entry.imageTag,
    },
    baseHp: entry.baseHp,
    baseAttack: entry.baseAttack,
    situation,
    choicesByBackground: catTemplate.choicesByBackground,
    defaultChoices: catTemplate.defaultChoices,
  };
}

// ===== 확장된 WAVE_POOLS (기존 18개 + 레지스트리 134개) =====

/** 기존 핸드크래프트 imageTag 집합 — 레지스트리 중복 방지 */
const EXISTING_TAGS = new Set(
  WAVE_TEMPLATES.map(t => t.enemy.imageTag)
    .concat(Object.values(WAVE_VARIANTS).flatMap(arr => arr.map(t => t.enemy.imageTag)))
);

/**
 * 웨이브 풀 재구성:
 * - 보스 웨이브(5, 10): 기존 고정 유지
 * - 비보스 웨이브: 기존 핸드크래프트 + 레지스트리 티어 매칭
 */
export const EXPANDED_WAVE_POOLS: WavePool[] = WAVE_TEMPLATES.map((base, idx) => {
  const waveNumber = idx + 1;
  const isBoss = waveNumber % 5 === 0;

  if (isBoss) {
    return { isBoss: true, variants: [base] };
  }

  // 기존 핸드크래프트 변형
  const handcrafted = WAVE_VARIANTS[waveNumber];
  const variants: WaveTemplate[] = handcrafted ? [base, ...handcrafted] : [base];

  // 레지스트리에서 해당 웨이브 티어의 몬스터 추가
  const allowedTiers = WAVE_TIER_MAP[waveNumber] ?? [];
  for (const tier of allowedTiers) {
    const monsters = MONSTERS_BY_TIER[tier] ?? [];
    for (const m of monsters) {
      if (!EXISTING_TAGS.has(m.imageTag)) {
        variants.push(buildTemplateFromRegistry(m));
      }
    }
  }

  return { isBoss: false, variants };
});

/** getWaveTemplateFromPool에서 사용 — 확장된 풀 반환 */
function _getExpandedPools(): WavePool[] {
  return EXPANDED_WAVE_POOLS;
}
