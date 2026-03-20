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
          700: '#2A3BAF',
          800: '#1E2B6B',
          900: '#111840',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#0F172A',
          nav: '#111111',
        },
        // Semantic tokens
        ink: '#1A1F3C',
        muted: '#8A8FA8',
        'muted-dark': '#9098C0',
        subtle: '#5A5E7A',
        'subtle-dark': '#C8CCF0',
        'card-dark': '#1C1E38',
        page: '#F5F6FA',
        'page-dark': '#12142A',
        chip: '#ECEEFF',
        'chip-dark': '#252845',
        divide: '#F0F2FF',
        'divide-dark': '#1E2040',
      },
    },
  },
  plugins: [],
};
