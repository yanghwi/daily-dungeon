/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // 배경
        midnight: {
          900: '#0f0f1a',    // 칠흑 (가장 어두운 배경)
          800: '#1a1a2e',    // 어두운 남색 (메인 배경)
          700: '#252542',    // 중간 보라 (카드 배경)
          600: '#2f2f5a',    // 밝은 보라 (호버)
        },
        // 강조
        arcane: {
          DEFAULT: '#7c3aed', // 보라 (Primary)
          light: '#a78bfa',   // 밝은 보라
          dark: '#5b21b6',    // 어두운 보라
        },
        indigo: {
          DEFAULT: '#4f46e5', // 인디고 (Secondary)
        },
        cyan: {
          DEFAULT: '#06b6d4', // 시안 (포인트)
        },
        gold: {
          DEFAULT: '#fbbf24', // 금색 (강조 텍스트)
        },
        // 주사위 tier 색상
        tier: {
          nat20: '#fbbf24',   // 금색 (영웅적)
          critical: '#22c55e', // 녹색 (강력)
          normal: '#94a3b8',   // 회색 (보통)
          fail: '#fb923c',     // 주황 (실패)
          nat1: '#ef4444',     // 빨강 (재앙)
        },
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif'],
        title: ['"Press Start 2P"', 'cursive'],
        body: ['Silkscreen', 'sans-serif'],
      },
      animation: {
        'dice-spin': 'diceSpin 0.6s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'typewriter': 'typewriter 0.05s steps(1) infinite',
        'shake': 'shake 0.3s ease-in-out',
      },
      keyframes: {
        diceSpin: {
          '0%': { transform: 'rotateX(0deg) rotateY(0deg)' },
          '100%': { transform: 'rotateX(720deg) rotateY(360deg)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(124, 58, 237, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.6)' },
        },
        scrollBg: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 -32px' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '50%': { transform: 'translateX(4px)' },
          '75%': { transform: 'translateX(-2px)' },
        },
      },
    },
  },
  plugins: [],
}
