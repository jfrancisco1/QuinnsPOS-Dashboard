/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#560591',
          50: '#F3E8FF',
          100: '#E4C8FF',
          200: '#CC96FF',
          300: '#B060FF',
          400: '#9130F0',
          500: '#7510C8',
          600: '#560591',
          700: '#400070',
          800: '#2A0050',
          900: '#160030',
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
