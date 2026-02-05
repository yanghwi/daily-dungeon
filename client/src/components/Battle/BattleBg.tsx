/**
 * 사이키델릭 전투 배경 — EarthBound 스타일
 * conic-gradient 소용돌이 + 스캔라인 오버레이
 */
export default function BattleBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* 바닥: 어두운 배경 */}
      <div className="absolute inset-0 bg-midnight-900" />

      {/* 1층: 소용돌이 */}
      <div
        className="absolute animate-[spin_20s_linear_infinite] opacity-30"
        style={{
          inset: '-50%',
          background: `repeating-conic-gradient(
            from 0deg at 50% 50%,
            #7c3aed 0deg 5deg,
            #0f0f1a 5deg 10deg,
            #4f46e5 10deg 15deg,
            #0f0f1a 15deg 20deg
          )`,
        }}
      />

      {/* 2층: 무지개 줄무늬 */}
      <div
        className="absolute inset-0 opacity-10 animate-[scrollBg_3s_linear_infinite]"
        style={{
          background: `repeating-linear-gradient(0deg,
            #e84393 0px, #6c5ce7 4px,
            #00cec9 8px, #fdcb6e 12px,
            #e84393 16px
          )`,
          backgroundSize: '100% 32px',
        }}
      />

      {/* 스캔라인 */}
      <div className="scanlines" />
    </div>
  );
}
