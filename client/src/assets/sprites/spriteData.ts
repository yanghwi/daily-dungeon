/**
 * 5종 적 스프라이트 box-shadow 데이터
 * 4px 그리드 기반, scale(3) 적용 시 화면 표시
 * 참조: docs/design-system/assets/earthbound-assets.html
 */

export interface SpriteConfig {
  boxShadow: string;
  /** idle 애니메이션 이름 (spriteAnimations.css에 정의) */
  idleAnimation: string;
  /** idle 애니메이션 duration */
  idleDuration: string;
  /** idle steps (retro feel) */
  idleSteps: number | null;
  /** 스프라이트 scale factor */
  scale: number;
  /** box-shadow 시각 영역 너비 (px) — 센터링 보정용 */
  visualWidth: number;
  /** box-shadow 시각 영역 높이 (px) — 센터링 보정용 */
  visualHeight: number;
}

const SPRITES: Record<string, SpriteConfig> = {
  /**
   * Wave 1: 성난 너구리 — 약 10x9 그리드
   * 회색 몸통 + 검은 마스크 + 줄무늬 꼬리
   */
  'raccoon': {
    boxShadow: [
      // 귀
      '8px 0px 0 #636e72', '32px 0px 0 #636e72',
      '8px 4px 0 #b2bec3', '32px 4px 0 #b2bec3',
      // 머리
      '12px 4px 0 #b2bec3', '16px 4px 0 #dfe6e9', '20px 4px 0 #dfe6e9', '24px 4px 0 #dfe6e9', '28px 4px 0 #b2bec3',
      // 눈 (검은 마스크)
      '8px 8px 0 #b2bec3', '12px 8px 0 #2d3436', '16px 8px 0 #fff', '20px 8px 0 #dfe6e9', '24px 8px 0 #fff', '28px 8px 0 #2d3436', '32px 8px 0 #b2bec3',
      // 코/입
      '12px 12px 0 #b2bec3', '16px 12px 0 #dfe6e9', '20px 12px 0 #2d3436', '24px 12px 0 #dfe6e9', '28px 12px 0 #b2bec3',
      '16px 16px 0 #b2bec3', '20px 16px 0 #e74c3c', '24px 16px 0 #b2bec3',
      // 몸통
      '8px 20px 0 #636e72', '12px 20px 0 #b2bec3', '16px 20px 0 #dfe6e9', '20px 20px 0 #dfe6e9', '24px 20px 0 #dfe6e9', '28px 20px 0 #b2bec3', '32px 20px 0 #636e72',
      '12px 24px 0 #636e72', '16px 24px 0 #b2bec3', '20px 24px 0 #b2bec3', '24px 24px 0 #b2bec3', '28px 24px 0 #636e72',
      // 발
      '12px 28px 0 #2d3436', '16px 28px 0 #2d3436', '24px 28px 0 #2d3436', '28px 28px 0 #2d3436',
      // 꼬리 (줄무늬)
      '36px 16px 0 #b2bec3', '40px 12px 0 #636e72', '44px 8px 0 #b2bec3', '48px 4px 0 #636e72',
    ].join(', '),
    idleAnimation: 'idle-bounce',
    idleDuration: '1s',
    idleSteps: 2,
    scale: 5,
    visualWidth: 52,
    visualHeight: 32,
  },

  /**
   * Wave 2: 이상한 자판기 — 약 8x12 그리드
   * 사각 몸통 + 글리치 디스플레이 + 동전 투입구
   */
  'vending-machine': {
    boxShadow: [
      // 상단 테두리
      '8px 0px 0 #636e72', '12px 0px 0 #636e72', '16px 0px 0 #636e72', '20px 0px 0 #636e72', '24px 0px 0 #636e72', '28px 0px 0 #636e72',
      // 디스플레이 (글리치 색상)
      '8px 4px 0 #a4b0be', '12px 4px 0 #00cec9', '16px 4px 0 #e84393', '20px 4px 0 #00cec9', '24px 4px 0 #6c5ce7', '28px 4px 0 #a4b0be',
      '8px 8px 0 #a4b0be', '12px 8px 0 #6c5ce7', '16px 8px 0 #fdcb6e', '20px 8px 0 #e84393', '24px 8px 0 #00cec9', '28px 8px 0 #a4b0be',
      // 눈 (디스플레이 안)
      '8px 12px 0 #a4b0be', '12px 12px 0 #2d3436', '16px 12px 0 #e74c3c', '20px 12px 0 #e74c3c', '24px 12px 0 #2d3436', '28px 12px 0 #a4b0be',
      // 구분선
      '8px 16px 0 #636e72', '12px 16px 0 #636e72', '16px 16px 0 #636e72', '20px 16px 0 #636e72', '24px 16px 0 #636e72', '28px 16px 0 #636e72',
      // 몸통 (버튼들)
      '8px 20px 0 #a4b0be', '12px 20px 0 #e74c3c', '16px 20px 0 #a4b0be', '20px 20px 0 #2ecc71', '24px 20px 0 #a4b0be', '28px 20px 0 #a4b0be',
      '8px 24px 0 #a4b0be', '12px 24px 0 #a4b0be', '16px 24px 0 #3498db', '20px 24px 0 #a4b0be', '24px 24px 0 #fdcb6e', '28px 24px 0 #a4b0be',
      // 동전 투입구
      '8px 28px 0 #a4b0be', '12px 28px 0 #a4b0be', '16px 28px 0 #2d3436', '20px 28px 0 #2d3436', '24px 28px 0 #a4b0be', '28px 28px 0 #a4b0be',
      // 하단 배출구
      '8px 32px 0 #636e72', '12px 32px 0 #2d3436', '16px 32px 0 #2d3436', '20px 32px 0 #2d3436', '24px 32px 0 #2d3436', '28px 32px 0 #636e72',
      '8px 36px 0 #636e72', '12px 36px 0 #636e72', '16px 36px 0 #636e72', '20px 36px 0 #636e72', '24px 36px 0 #636e72', '28px 36px 0 #636e72',
      // 다리
      '8px 40px 0 #2d3436', '12px 40px 0 #2d3436', '24px 40px 0 #2d3436', '28px 40px 0 #2d3436',
    ].join(', '),
    idleAnimation: 'idle-wobble',
    idleDuration: '1.2s',
    idleSteps: 2,
    scale: 5,
    visualWidth: 32,
    visualHeight: 44,
  },

  /**
   * Wave 3: 그림자 고양이 떼 — 약 12x8 그리드 (가로로 넓게)
   * 3마리 겹친 실루엣, 보라+남색 톤, 빛나는 눈
   */
  'shadow-cats': {
    boxShadow: [
      // 고양이 1 (왼쪽, 약간 뒤)
      '4px 8px 0 #2d3436', '8px 8px 0 #2d3436',
      '0px 12px 0 #2d3436', '4px 12px 0 #3d3d5c', '8px 12px 0 #3d3d5c', '12px 12px 0 #2d3436',
      '0px 16px 0 #3d3d5c', '4px 16px 0 #e84393', '8px 16px 0 #3d3d5c', '12px 16px 0 #e84393',
      '0px 20px 0 #3d3d5c', '4px 20px 0 #3d3d5c', '8px 20px 0 #3d3d5c', '12px 20px 0 #3d3d5c',
      '0px 24px 0 #2d3436', '4px 24px 0 #3d3d5c', '8px 24px 0 #3d3d5c', '12px 24px 0 #2d3436',
      // 고양이 2 (가운데, 앞쪽 — 크게)
      '16px 4px 0 #2d3436', '20px 4px 0 #4a4a6a',
      '28px 4px 0 #4a4a6a', '32px 4px 0 #2d3436',
      '12px 8px 0 #4a4a6a', '16px 8px 0 #6c5ce7', '20px 8px 0 #4a4a6a', '24px 8px 0 #4a4a6a', '28px 8px 0 #6c5ce7', '32px 8px 0 #4a4a6a',
      '12px 12px 0 #4a4a6a', '16px 12px 0 #4a4a6a', '20px 12px 0 #4a4a6a', '24px 12px 0 #4a4a6a', '28px 12px 0 #4a4a6a', '32px 12px 0 #4a4a6a',
      '16px 16px 0 #4a4a6a', '20px 16px 0 #6c5ce7', '24px 16px 0 #6c5ce7', '28px 16px 0 #4a4a6a',
      '16px 20px 0 #2d3436', '20px 20px 0 #4a4a6a', '24px 20px 0 #4a4a6a', '28px 20px 0 #2d3436',
      '16px 24px 0 #2d3436', '28px 24px 0 #2d3436',
      // 고양이 3 (오른쪽, 약간 뒤)
      '36px 8px 0 #2d3436', '40px 8px 0 #2d3436',
      '32px 12px 0 #2d3436', '36px 12px 0 #3d3d5c', '40px 12px 0 #3d3d5c', '44px 12px 0 #2d3436',
      '32px 16px 0 #3d3d5c', '36px 16px 0 #a29bfe', '40px 16px 0 #3d3d5c', '44px 16px 0 #a29bfe',
      '32px 20px 0 #3d3d5c', '36px 20px 0 #3d3d5c', '40px 20px 0 #3d3d5c', '44px 20px 0 #3d3d5c',
      '36px 24px 0 #2d3436', '40px 24px 0 #2d3436',
    ].join(', '),
    idleAnimation: 'idle-float',
    idleDuration: '2s',
    idleSteps: null,
    scale: 5,
    visualWidth: 48,
    visualHeight: 28,
  },

  /**
   * Wave 4: 폭주 청소로봇 — 약 10x10 그리드
   * 금속 몸통 + 빨간 경고등 + 브러시 팔
   */
  'cleaning-robot': {
    boxShadow: [
      // 경고등
      '20px 0px 0 #e74c3c',
      // 머리 (돔)
      '16px 4px 0 #a4b0be', '20px 4px 0 #dfe6e9', '24px 4px 0 #a4b0be',
      '12px 8px 0 #a4b0be', '16px 8px 0 #dfe6e9', '20px 8px 0 #dfe6e9', '24px 8px 0 #dfe6e9', '28px 8px 0 #a4b0be',
      // 눈 (LED)
      '12px 12px 0 #636e72', '16px 12px 0 #00cec9', '20px 12px 0 #636e72', '24px 12px 0 #00cec9', '28px 12px 0 #636e72',
      // 몸통
      '8px 16px 0 #636e72', '12px 16px 0 #a4b0be', '16px 16px 0 #dfe6e9', '20px 16px 0 #dfe6e9', '24px 16px 0 #dfe6e9', '28px 16px 0 #a4b0be', '32px 16px 0 #636e72',
      '8px 20px 0 #636e72', '12px 20px 0 #a4b0be', '16px 20px 0 #e74c3c', '20px 20px 0 #a4b0be', '24px 20px 0 #e74c3c', '28px 20px 0 #a4b0be', '32px 20px 0 #636e72',
      '8px 24px 0 #636e72', '12px 24px 0 #a4b0be', '16px 24px 0 #a4b0be', '20px 24px 0 #a4b0be', '24px 24px 0 #a4b0be', '28px 24px 0 #a4b0be', '32px 24px 0 #636e72',
      // 팔 (브러시)
      '0px 16px 0 #636e72', '4px 16px 0 #2ecc71', '4px 20px 0 #2ecc71', '0px 24px 0 #2ecc71',
      '36px 16px 0 #636e72', '40px 16px 0 #2ecc71', '40px 20px 0 #2ecc71', '36px 24px 0 #2ecc71',
      // 하단 (바퀴)
      '12px 28px 0 #636e72', '16px 28px 0 #2d3436', '20px 28px 0 #636e72', '24px 28px 0 #2d3436', '28px 28px 0 #636e72',
      '16px 32px 0 #2d3436', '24px 32px 0 #2d3436',
    ].join(', '),
    idleAnimation: 'idle-pulse',
    idleDuration: '0.8s',
    idleSteps: 2,
    scale: 6,
    visualWidth: 44,
    visualHeight: 36,
  },

  /**
   * Wave 5: 야시장의 주인 (보스) — 약 12x12 그리드
   * 큰 체격 + 앞치마 + 빛나는 눈 + 국자 무기
   */
  'market-boss': {
    boxShadow: [
      // 머리 (두건)
      '16px 0px 0 #e74c3c', '20px 0px 0 #c0392b', '24px 0px 0 #e74c3c', '28px 0px 0 #c0392b', '32px 0px 0 #e74c3c',
      '12px 4px 0 #e74c3c', '16px 4px 0 #c0392b', '20px 4px 0 #e74c3c', '24px 4px 0 #c0392b', '28px 4px 0 #e74c3c', '32px 4px 0 #c0392b', '36px 4px 0 #e74c3c',
      // 얼굴
      '12px 8px 0 #ffeaa7', '16px 8px 0 #ffeaa7', '20px 8px 0 #ffeaa7', '24px 8px 0 #ffeaa7', '28px 8px 0 #ffeaa7', '32px 8px 0 #ffeaa7', '36px 8px 0 #ffeaa7',
      // 눈 (빛나는)
      '12px 12px 0 #ffeaa7', '16px 12px 0 #fdcb6e', '20px 12px 0 #2d3436', '24px 12px 0 #ffeaa7', '28px 12px 0 #2d3436', '32px 12px 0 #fdcb6e', '36px 12px 0 #ffeaa7',
      // 입 (웃는)
      '16px 16px 0 #ffeaa7', '20px 16px 0 #e17055', '24px 16px 0 #e17055', '28px 16px 0 #e17055', '32px 16px 0 #ffeaa7',
      // 몸통 (앞치마)
      '8px 20px 0 #2d3436', '12px 20px 0 #dfe6e9', '16px 20px 0 #fff', '20px 20px 0 #fff', '24px 20px 0 #fff', '28px 20px 0 #fff', '32px 20px 0 #fff', '36px 20px 0 #dfe6e9', '40px 20px 0 #2d3436',
      '8px 24px 0 #2d3436', '12px 24px 0 #dfe6e9', '16px 24px 0 #fff', '20px 24px 0 #e74c3c', '24px 24px 0 #fff', '28px 24px 0 #e74c3c', '32px 24px 0 #fff', '36px 24px 0 #dfe6e9', '40px 24px 0 #2d3436',
      '8px 28px 0 #2d3436', '12px 28px 0 #dfe6e9', '16px 28px 0 #dfe6e9', '20px 28px 0 #dfe6e9', '24px 28px 0 #dfe6e9', '28px 28px 0 #dfe6e9', '32px 28px 0 #dfe6e9', '36px 28px 0 #dfe6e9', '40px 28px 0 #2d3436',
      // 다리
      '12px 32px 0 #2d3436', '16px 32px 0 #636e72', '20px 32px 0 #636e72', '28px 32px 0 #636e72', '32px 32px 0 #636e72', '36px 32px 0 #2d3436',
      '16px 36px 0 #2d3436', '20px 36px 0 #2d3436', '28px 36px 0 #2d3436', '32px 36px 0 #2d3436',
      // 국자 (왼손)
      '0px 16px 0 #a4b0be', '4px 16px 0 #a4b0be',
      '0px 12px 0 #636e72', '4px 12px 0 #a4b0be', '0px 8px 0 #636e72',
      '0px 20px 0 #a4b0be', '4px 20px 0 #ffeaa7',
    ].join(', '),
    idleAnimation: 'idle-float',
    idleDuration: '3s',
    idleSteps: null,
    scale: 7,
    visualWidth: 44,
    visualHeight: 40,
  },

  /**
   * Wave 6: 폭주 배달 오토바이 — 약 12x10 그리드
   * 빨간 배달통 + 바퀴 + 빛나는 헤드라이트
   */
  'delivery-bike': {
    boxShadow: [
      // 헤드라이트
      '4px 4px 0 #fdcb6e', '8px 4px 0 #fff',
      // 핸들바
      '0px 8px 0 #636e72', '4px 8px 0 #a4b0be', '8px 8px 0 #a4b0be', '12px 8px 0 #636e72',
      // 차체 (빨간)
      '8px 12px 0 #e74c3c', '12px 12px 0 #c0392b', '16px 12px 0 #e74c3c', '20px 12px 0 #c0392b',
      '4px 16px 0 #636e72', '8px 16px 0 #e74c3c', '12px 16px 0 #e74c3c', '16px 16px 0 #c0392b', '20px 16px 0 #e74c3c', '24px 16px 0 #636e72',
      // 배달통 (3개)
      '28px 4px 0 #e74c3c', '32px 4px 0 #c0392b', '36px 4px 0 #e74c3c',
      '28px 8px 0 #c0392b', '32px 8px 0 #fff', '36px 8px 0 #c0392b',
      '28px 12px 0 #e74c3c', '32px 12px 0 #c0392b', '36px 12px 0 #e74c3c',
      '40px 8px 0 #e74c3c', '44px 8px 0 #c0392b',
      '40px 12px 0 #c0392b', '44px 12px 0 #e74c3c',
      // 눈 (헤드라이트 = 눈)
      '4px 12px 0 #e74c3c', '8px 8px 0 #e74c3c',
      // 엔진
      '8px 20px 0 #636e72', '12px 20px 0 #a4b0be', '16px 20px 0 #a4b0be', '20px 20px 0 #636e72',
      // 배기가스
      '0px 20px 0 #b2bec3', '0px 24px 0 #dfe6e9',
      // 바퀴 (앞)
      '4px 24px 0 #2d3436', '8px 24px 0 #636e72', '8px 28px 0 #2d3436', '4px 28px 0 #636e72',
      // 바퀴 (뒤)
      '20px 24px 0 #2d3436', '24px 24px 0 #636e72', '24px 28px 0 #2d3436', '20px 28px 0 #636e72',
    ].join(', '),
    idleAnimation: 'idle-vibrate',
    idleDuration: '0.3s',
    idleSteps: 2,
    scale: 5,
    visualWidth: 48,
    visualHeight: 32,
  },

  /**
   * Wave 7: 지하상가 마네킹 무리 — 약 12x10 그리드
   * 3체 실루엣 + 빈 눈 + 관절 라인
   */
  'mannequins': {
    boxShadow: [
      // 마네킹 1 (왼쪽)
      '4px 0px 0 #dfe6e9', '8px 0px 0 #dfe6e9',
      '4px 4px 0 #b2bec3', '8px 4px 0 #b2bec3',
      '0px 8px 0 #dfe6e9', '4px 8px 0 #2d3436', '8px 8px 0 #2d3436', '12px 8px 0 #dfe6e9',
      '4px 12px 0 #dfe6e9', '8px 12px 0 #dfe6e9',
      '0px 16px 0 #b2bec3', '4px 16px 0 #dfe6e9', '8px 16px 0 #dfe6e9', '12px 16px 0 #b2bec3',
      '4px 20px 0 #b2bec3', '8px 20px 0 #b2bec3',
      '4px 24px 0 #a4b0be', '8px 24px 0 #a4b0be',
      // 마네킹 2 (가운데, 크게)
      '20px 0px 0 #ffeaa7', '24px 0px 0 #ffeaa7',
      '16px 4px 0 #ffeaa7', '20px 4px 0 #ffeaa7', '24px 4px 0 #ffeaa7', '28px 4px 0 #ffeaa7',
      '16px 8px 0 #2d3436', '20px 8px 0 #ffeaa7', '24px 8px 0 #ffeaa7', '28px 8px 0 #2d3436',
      '20px 12px 0 #e17055', '24px 12px 0 #ffeaa7',
      '16px 16px 0 #dfe6e9', '20px 16px 0 #fff', '24px 16px 0 #fff', '28px 16px 0 #dfe6e9',
      '16px 20px 0 #dfe6e9', '20px 20px 0 #dfe6e9', '24px 20px 0 #dfe6e9', '28px 20px 0 #dfe6e9',
      '16px 24px 0 #b2bec3', '20px 24px 0 #b2bec3', '24px 24px 0 #b2bec3', '28px 24px 0 #b2bec3',
      '16px 28px 0 #a4b0be', '20px 28px 0 #a4b0be', '24px 28px 0 #a4b0be', '28px 28px 0 #a4b0be',
      // 마네킹 3 (오른쪽)
      '36px 0px 0 #b2bec3', '40px 0px 0 #b2bec3',
      '36px 4px 0 #dfe6e9', '40px 4px 0 #dfe6e9',
      '32px 8px 0 #dfe6e9', '36px 8px 0 #2d3436', '40px 8px 0 #2d3436', '44px 8px 0 #dfe6e9',
      '36px 12px 0 #dfe6e9', '40px 12px 0 #dfe6e9',
      '32px 16px 0 #b2bec3', '36px 16px 0 #dfe6e9', '40px 16px 0 #dfe6e9', '44px 16px 0 #b2bec3',
      '36px 20px 0 #b2bec3', '40px 20px 0 #b2bec3',
      '36px 24px 0 #a4b0be', '40px 24px 0 #a4b0be',
    ].join(', '),
    idleAnimation: 'idle-twitch',
    idleDuration: '2s',
    idleSteps: 4,
    scale: 5,
    visualWidth: 48,
    visualHeight: 28,
  },

  /**
   * Wave 8: 네온사인 요괴 — 약 10x10 그리드
   * 글씨 형태의 빛 + 네온 색상 + 깜빡임
   */
  'neon-ghost': {
    boxShadow: [
      // 몸체 (네온 빛)
      '12px 0px 0 #e84393', '16px 0px 0 #fd79a8', '20px 0px 0 #e84393', '24px 0px 0 #6c5ce7', '28px 0px 0 #a29bfe',
      '8px 4px 0 #fd79a8', '12px 4px 0 #e84393', '16px 4px 0 #6c5ce7', '20px 4px 0 #a29bfe', '24px 4px 0 #e84393', '28px 4px 0 #fd79a8', '32px 4px 0 #6c5ce7',
      // 눈 (밝은 흰색)
      '8px 8px 0 #6c5ce7', '12px 8px 0 #fff', '16px 8px 0 #e84393', '20px 8px 0 #a29bfe', '24px 8px 0 #e84393', '28px 8px 0 #fff', '32px 8px 0 #6c5ce7',
      // 입 ("영업중" 글씨)
      '8px 12px 0 #e84393', '12px 12px 0 #00cec9', '16px 12px 0 #fdcb6e', '20px 12px 0 #00cec9', '24px 12px 0 #fdcb6e', '28px 12px 0 #00cec9', '32px 12px 0 #e84393',
      // 몸통 (빛 파편)
      '4px 16px 0 #a29bfe', '8px 16px 0 #fd79a8', '12px 16px 0 #6c5ce7', '16px 16px 0 #e84393', '20px 16px 0 #fd79a8', '24px 16px 0 #6c5ce7', '28px 16px 0 #e84393', '32px 16px 0 #a29bfe', '36px 16px 0 #fd79a8',
      '8px 20px 0 #6c5ce7', '12px 20px 0 #e84393', '16px 20px 0 #a29bfe', '20px 20px 0 #e84393', '24px 20px 0 #fd79a8', '28px 20px 0 #a29bfe', '32px 20px 0 #6c5ce7',
      // 하단 (빛 흩어짐)
      '12px 24px 0 #fd79a8', '16px 24px 0 #6c5ce7', '24px 24px 0 #a29bfe', '28px 24px 0 #e84393',
      '8px 28px 0 #a29bfe', '20px 28px 0 #e84393', '32px 28px 0 #fd79a8',
    ].join(', '),
    idleAnimation: 'idle-flicker',
    idleDuration: '1.5s',
    idleSteps: null,
    scale: 6,
    visualWidth: 40,
    visualHeight: 32,
  },

  /**
   * Wave 9: 전파 먹는 안테나 — 약 8x14 그리드
   * 세로로 긴 안테나 + 촉수 + 보라 전기
   */
  'antenna-monster': {
    boxShadow: [
      // 안테나 끝 (발광)
      '20px 0px 0 #6c5ce7', '24px 0px 0 #a29bfe',
      '16px 4px 0 #a29bfe', '20px 4px 0 #e84393', '24px 4px 0 #6c5ce7', '28px 4px 0 #a29bfe',
      // 안테나 봉
      '20px 8px 0 #636e72', '24px 8px 0 #a4b0be',
      '20px 12px 0 #a4b0be', '24px 12px 0 #636e72',
      // 눈 (LED)
      '16px 16px 0 #636e72', '20px 16px 0 #e74c3c', '24px 16px 0 #636e72', '28px 16px 0 #e74c3c',
      // 본체 (박스)
      '12px 20px 0 #636e72', '16px 20px 0 #a4b0be', '20px 20px 0 #dfe6e9', '24px 20px 0 #a4b0be', '28px 20px 0 #a4b0be', '32px 20px 0 #636e72',
      '12px 24px 0 #636e72', '16px 24px 0 #a4b0be', '20px 24px 0 #a4b0be', '24px 24px 0 #dfe6e9', '28px 24px 0 #a4b0be', '32px 24px 0 #636e72',
      '12px 28px 0 #636e72', '16px 28px 0 #636e72', '20px 28px 0 #636e72', '24px 28px 0 #636e72', '28px 28px 0 #636e72', '32px 28px 0 #636e72',
      // 촉수 (전파 = 보라)
      '4px 12px 0 #6c5ce7', '8px 16px 0 #a29bfe', '4px 20px 0 #6c5ce7', '0px 24px 0 #a29bfe',
      '36px 12px 0 #a29bfe', '40px 16px 0 #6c5ce7', '36px 20px 0 #a29bfe', '44px 24px 0 #6c5ce7',
      // 전기 스파크
      '0px 8px 0 #fdcb6e', '8px 4px 0 #fdcb6e', '36px 4px 0 #fdcb6e', '44px 8px 0 #fdcb6e',
      // 지지대 (다리)
      '16px 32px 0 #636e72', '20px 32px 0 #2d3436', '24px 32px 0 #2d3436', '28px 32px 0 #636e72',
      '12px 36px 0 #2d3436', '32px 36px 0 #2d3436',
    ].join(', '),
    idleAnimation: 'idle-spark',
    idleDuration: '1s',
    idleSteps: 3,
    scale: 5,
    visualWidth: 48,
    visualHeight: 40,
  },

  /**
   * Wave 10: 자정의 시계 (최종보스) — 약 12x14 그리드
   * 시계 문자판 + 시침/분침 + 톱니바퀴 + 금색 빛
   */
  'midnight-clock': {
    boxShadow: [
      // 종 (상단)
      '20px 0px 0 #fdcb6e', '24px 0px 0 #f39c12', '28px 0px 0 #fdcb6e',
      // 시계 문자판 (원형)
      '16px 4px 0 #2d3436', '20px 4px 0 #f39c12', '24px 4px 0 #fdcb6e', '28px 4px 0 #f39c12', '32px 4px 0 #2d3436',
      '12px 8px 0 #2d3436', '16px 8px 0 #ffeaa7', '20px 8px 0 #fff', '24px 8px 0 #fff', '28px 8px 0 #fff', '32px 8px 0 #ffeaa7', '36px 8px 0 #2d3436',
      '8px 12px 0 #2d3436', '12px 12px 0 #ffeaa7', '16px 12px 0 #fff', '20px 12px 0 #fff', '24px 12px 0 #e74c3c', '28px 12px 0 #fff', '32px 12px 0 #fff', '36px 12px 0 #ffeaa7', '40px 12px 0 #2d3436',
      // 눈 (시계 숫자 위치)
      '8px 16px 0 #2d3436', '12px 16px 0 #ffeaa7', '16px 16px 0 #fff', '20px 16px 0 #e84393', '24px 16px 0 #2d3436', '28px 16px 0 #e84393', '32px 16px 0 #fff', '36px 16px 0 #ffeaa7', '40px 16px 0 #2d3436',
      // 시침/분침 (XII 표시)
      '8px 20px 0 #2d3436', '12px 20px 0 #ffeaa7', '16px 20px 0 #fff', '20px 20px 0 #fff', '24px 20px 0 #6c5ce7', '28px 20px 0 #fff', '32px 20px 0 #fff', '36px 20px 0 #ffeaa7', '40px 20px 0 #2d3436',
      '12px 24px 0 #2d3436', '16px 24px 0 #ffeaa7', '20px 24px 0 #fff', '24px 24px 0 #fff', '28px 24px 0 #fff', '32px 24px 0 #ffeaa7', '36px 24px 0 #2d3436',
      '16px 28px 0 #2d3436', '20px 28px 0 #f39c12', '24px 28px 0 #fdcb6e', '28px 28px 0 #f39c12', '32px 28px 0 #2d3436',
      // 톱니바퀴 (좌우)
      '0px 12px 0 #f39c12', '4px 16px 0 #fdcb6e', '0px 20px 0 #f39c12',
      '44px 12px 0 #fdcb6e', '48px 16px 0 #f39c12', '44px 20px 0 #fdcb6e',
      // 추 (하단)
      '20px 32px 0 #636e72', '24px 32px 0 #a4b0be', '28px 32px 0 #636e72',
      '20px 36px 0 #a4b0be', '24px 36px 0 #f39c12', '28px 36px 0 #a4b0be',
      '24px 40px 0 #fdcb6e',
      // 시간 왜곡 파티클
      '4px 4px 0 #6c5ce7', '44px 4px 0 #a29bfe', '0px 28px 0 #6c5ce7', '48px 28px 0 #a29bfe',
    ].join(', '),
    idleAnimation: 'idle-pendulum',
    idleDuration: '2.5s',
    idleSteps: null,
    scale: 7,
    visualWidth: 52,
    visualHeight: 44,
  },
};

export default SPRITES;
