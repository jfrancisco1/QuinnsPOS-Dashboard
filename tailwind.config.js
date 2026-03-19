/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B55D5',
          50: '#EEF2FF',
          100: '#DCEAFF',
          200: '#BFCEFF',
          300: '#93AEFF',
          400: '#7B9EFF',
          500: '#5B7FEE',
          600: '#3B55D5',
          700: '#2D3FAB',
          800: '#1E2B6B',
          900: '#111840',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#0F172A',
          nav: '#111111',
        },
      },
    },
  },
  plugins: [],
};
