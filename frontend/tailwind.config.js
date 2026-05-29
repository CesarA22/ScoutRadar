/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Saira Condensed', 'Rajdhani', 'sans-serif'],
        stats: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        fut: {
          bg: '#070a12',
          surface: '#0d1320',
          card: '#121a2b',
          elevated: '#1a2438',
          border: 'rgba(255,255,255,0.08)',
          gold: '#f4cf6b',
          'gold-dark': '#c9a23a',
          emerald: '#10d979',
          'emerald-dim': '#0a9d5c',
          bronze: '#cd7f32',
          silver: '#c0c0c0',
        },
      },
      boxShadow: {
        'glow-gold': '0 0 24px rgba(244, 207, 107, 0.35), 0 0 48px rgba(244, 207, 107, 0.15)',
        'glow-emerald': '0 0 24px rgba(16, 217, 121, 0.35)',
        'glow-special': '0 0 32px rgba(244, 207, 107, 0.5), 0 0 64px rgba(16, 217, 121, 0.2)',
        card: '0 8px 32px rgba(0,0,0,0.45)',
      },
      animation: {
        shimmer: 'shimmer 2.5s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'card-in': 'card-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '0.4', transform: 'translateX(-100%)' },
          '50%': { opacity: '0.8', transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(244, 207, 107, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(244, 207, 107, 0.55)' },
        },
        'card-in': {
          '0%': { opacity: '0', transform: 'scale(0.85) rotateY(-12deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotateY(0)' },
        },
      },
      backgroundImage: {
        'fut-radial': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 217, 121, 0.12), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(244, 207, 107, 0.08), transparent)',
      },
    },
  },
  plugins: [],
}
