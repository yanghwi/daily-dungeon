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
  },
};

export default SPRITES;
