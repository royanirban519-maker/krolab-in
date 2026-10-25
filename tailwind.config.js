/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#08080a',
          900: '#0d0d11',
          800: '#141419',
          700: '#1c1c24',
          600: '#26262f',
          500: '#33333f',
        },
        gold: {
          50: '#fbf7ec',
          100: '#f5edd4',
          200: '#ebd9a8',
          300: '#dcc070',
          400: '#cda94a',
          500: '#c9a961',
          600: '#b8923a',
          700: '#94712c',
          800: '#6f5422',
          900: '#4d3a18',
        },
        sand: {
          50: '#fdfbf7',
          100: '#F4EFE6',
          200: '#EDE5D8',
          300: '#e3d8c5',
          400: '#d4c5a8',
          500: '#c2af8c',
        },
        royal: {
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e3a8a',
          800: '#172554',
        },
        ember: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 60px -10px rgba(201,169,97,0.45)',
        'glow-lg': '0 0 120px -20px rgba(201,169,97,0.55)',
        card: '0 20px 60px -20px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'radial-gold': 'radial-gradient(circle at 50% 50%, rgba(201,169,97,0.18), transparent 60%)',
      },
      animation: {
        'spin-slow': 'spin 40s linear infinite',
        'spin-reverse': 'spin-reverse 50s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s ease-out both',
        shimmer: 'shimmer 3s linear infinite',
      },
      keyframes: {
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
