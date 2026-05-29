/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f0f14',
          secondary: '#16161e',
          card: '#1c1c26',
          elevated: '#242430',
        },
        border: {
          DEFAULT: '#2a2a38',
          subtle: '#1f1f2a',
        },
        text: {
          primary: '#f0f0f5',
          secondary: '#8b8b9e',
          muted: '#636378',
        },
        accent: {
          DEFAULT: '#7c5cff',
          hover: '#9278ff',
        },
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '14px',
      },
    },
  },
  plugins: [],
}
