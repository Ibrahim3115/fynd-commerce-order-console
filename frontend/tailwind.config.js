/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0f1117',
        'brand-panel': '#161b27',
        'brand-card': '#1a2035',
        'brand-border': '#2a3550',
        'brand-orange': '#f97316',
        'brand-orange-dark': '#c2410c',
      },
    },
  },
  plugins: [],
};
