/**
 * 스테이지 기반 배경 시스템
 *
 * 설계 원칙:
 * - 하나의 스테이지(10웨이브) = 일관된 배경 테마
 * - Wave 1~4, 6~9 (일반전): 스테이지 기본 배경
 * - Wave 5 (중보스): 기본 배경 + 보스 전용 오버레이 (위협감)
 * - Wave 10 (최종보스): 완전히 다른 보스 전용 배경
 *
 * 참조: docs/design-system/references/backgrounds.md
 */

export interface BgLayer {
  /** CSS background 값 */
  background: string;
  /** CSS animation 값 */
  animation: string;
  /** opacity (0-1) */
  opacity: number;
  /** CSS inset 값 (소용돌이/체커는 확장 필요) */
  inset: string;
}

export interface WaveBgConfig {
  label: string;
  layers: BgLayer[];
}

// ===== 스테이지 기본 배경 =====
// 모든 일반 웨이브에 사용 — 어두운 야시장/골목길 톤

const STAGE_BASE: WaveBgConfig = {
  label: '야시장 골목',
  layers: [
    // 은은한 보라색 소용돌이 (공간감)
    {
      background: `repeating-conic-gradient(
        from 0deg at 50% 50%,
        #6c5ce7 0deg 5deg,
        #0d0221 5deg 10deg,
        #a29bfe 10deg 15deg,
        #0d0221 15deg 20deg
      )`,
      animation: 'swirlSpin 20s linear infinite',
      opacity: 0.2,
      inset: '-50%',
    },
    // 시안 글로우 (야시장 네온)
    {
      background: 'radial-gradient(ellipse at 50% 50%, rgba(0,206,201,0.15), transparent 70%)',
      animation: 'glowPulse 4s ease-in-out infinite',
      opacity: 0.7,
      inset: '0',
    },
  ],
};

// ===== 중보스 배경 (Wave 5) =====
// 기본 배경 위에 붉은/보라 경고 오버레이 추가

const MID_BOSS_OVERLAY: BgLayer[] = [
  // 붉은 경고 펄스
  {
    background: 'radial-gradient(ellipse at 50% 40%, rgba(231,76,60,0.25), transparent 60%)',
    animation: 'bossWarnPulse 2s ease-in-out infinite',
    opacity: 0.9,
    inset: '0',
  },
  // 보라색 다이아몬드 격자 (긴장감)
  {
    background: `repeating-linear-gradient(45deg,
        transparent 0px, transparent 12px,
        rgba(232,67,147,0.2) 12px, rgba(232,67,147,0.2) 13px),
      repeating-linear-gradient(-45deg,
        transparent 0px, transparent 12px,
        rgba(108,92,231,0.15) 12px, rgba(108,92,231,0.15) 13px)`,
    animation: 'diamondPulse 3s ease-in-out infinite',
    opacity: 0.7,
    inset: '0',
  },
];

const MID_BOSS_BG: WaveBgConfig = {
  label: '야시장 — 보스 출현',
  layers: [
    // 기본 배경 (속도 2배로 불안감)
    {
      ...STAGE_BASE.layers[0],
      animation: 'swirlSpin 10s linear infinite',
      opacity: 0.35,
    },
    STAGE_BASE.layers[1],
    // 보스 오버레이
    ...MID_BOSS_OVERLAY,
  ],
};

// ===== 최종보스 배경 (Wave 10) =====
// 완전히 새로운 사이키델릭 배경 — "이건 잡몹이 아니다"

const FINAL_BOSS_BG: WaveBgConfig = {
  label: '심연',
  layers: [
    // 전체 회전 소용돌이 (강렬한 핑크/보라)
    {
      background: `repeating-conic-gradient(
        from 0deg at 50% 50%,
        #e84393 0deg 4deg,
        #0d0221 4deg 8deg,
        #6c5ce7 8deg 12deg,
        #0d0221 12deg 16deg
      )`,
      animation: 'finalBossSpin 8s linear infinite',
      opacity: 0.5,
      inset: '-50%',
    },
    // 무지개 디스토션 (빠르게 스크롤)
    {
      background: `repeating-linear-gradient(0deg,
        #e74c3c 0px, #e67e22 2px,
        #fdcb6e 4px, #2ecc71 6px,
        #00cec9 8px, #3498db 10px,
        #6c5ce7 12px, #e84393 14px
      )`,
      animation: 'distortScroll 1.5s linear infinite',
      opacity: 0.35,
      inset: '0',
    },
    // 금색 글로우 (중앙, 강렬)
    {
      background: 'radial-gradient(ellipse at 50% 40%, rgba(253,203,110,0.3), transparent 50%)',
      animation: 'bossWarnPulse 1.5s ease-in-out infinite',
      opacity: 1,
      inset: '0',
    },
    // 색 반전 오버레이
    {
      background: 'radial-gradient(circle at 50% 50%, rgba(108,92,231,0.15), rgba(232,67,147,0.1) 50%, transparent 70%)',
      animation: 'finalBossInvert 4s ease-in-out infinite',
      opacity: 0.8,
      inset: '0',
    },
  ],
};

// ===== 웨이브 → 배경 매핑 =====

/**
 * 웨이브 번호와 보스 여부를 기반으로 배경 설정 반환
 */
export function getWaveBackground(waveNumber: number, isBoss: boolean = false, bossType?: 'mid' | 'final'): WaveBgConfig {
  // 최종보스
  if (isBoss && bossType === 'final') return FINAL_BOSS_BG;
  // 중보스
  if (isBoss && bossType === 'mid') return MID_BOSS_BG;
  // Wave 5는 아직 보스 정보 없어도 중보스 취급
  if (waveNumber === 5) return MID_BOSS_BG;
  // Wave 10은 아직 보스 정보 없어도 최종보스 취급
  if (waveNumber === 10) return FINAL_BOSS_BG;
  // 일반 웨이브
  return STAGE_BASE;
}

export { STAGE_BASE, MID_BOSS_BG, FINAL_BOSS_BG };
