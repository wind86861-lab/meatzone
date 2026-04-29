/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MeatZone — deep charcoal + signature red + warm amber
        bg: {
          DEFAULT: '#F5F0EC',
          surface: '#FFFFFF',
          surface2: '#F0EBE6',
          surface3: '#E6E0DA',
        },
        primary: {
          DEFAULT: '#E8251A',
          50: '#FDECEA',
          100: '#FBC9C5',
          200: '#F69690',
          300: '#F1635B',
          400: '#EC4138',
          500: '#E8251A',
          600: '#C41810',
          700: '#9C130D',
          800: '#740E09',
          900: '#4C0906',
        },
        amber: {
          DEFAULT: '#F57C20',
          50: '#FEF1E5',
          100: '#FCD7B5',
          200: '#FAB880',
          300: '#F89A4D',
          400: '#F68830',
          500: '#F57C20',
          600: '#D5651A',
          700: '#A84F14',
          800: '#7A380E',
          900: '#4D2208',
        },
        ink: {
          DEFAULT: '#2A1E18',
          dim: '#7A6558',
          mute: '#A08E80',
          line: 'rgba(60,40,30,.12)',
          line2: 'rgba(60,40,30,.06)',
        },
        success: '#1E7A3E',
        warning: '#F59E0B',
        danger: '#E8251A',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"DM Sans"', '"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'sm': '10px',
        'md': '16px',
        'lg': '20px',
        'xl': '26px',
      },
      boxShadow: {
        'soft': '0 2px 12px -2px rgba(0,0,0,.35)',
        'card': '0 8px 22px -8px rgba(0,0,0,.55)',
        'pop': '0 14px 32px -10px rgba(232,37,26,.35)',
        'glow': '0 0 0 4px rgba(232,37,26,.18)',
        'inset-line': 'inset 0 0 0 1px rgba(255,180,150,.13)',
      },
      backgroundImage: {
        'red-gradient': 'linear-gradient(130deg,#6B0A0A 0%,#B81410 55%,#D42020 100%)',
        'dark-gradient': 'linear-gradient(130deg,#1A0C08 0%,#2D1510 55%,#3D2015 100%)',
        'amber-gradient': 'linear-gradient(130deg,#3D1800 0%,#6B2E00 60%,#8B4010 100%)',
        'meat-stripes': 'repeating-linear-gradient(-55deg,transparent 0,transparent 18px,rgba(0,0,0,.08) 18px,rgba(0,0,0,.08) 19px)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-up': 'fadeUp .45s cubic-bezier(.22,1,.36,1) both',
        'pop': 'pop .25s ease',
        'shimmer': 'shimmer 1.6s linear infinite',
        'marquee': 'marquee 28s linear infinite',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pop: { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(.86)' }, '100%': { transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
        marquee: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(-100%)' } },
      },
    },
  },
  plugins: [],
}
