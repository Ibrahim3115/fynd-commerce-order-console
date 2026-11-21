/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design System Palette
        'brand-bg': '#090B0E',
        'brand-surface': '#11151B',
        'brand-surface-2': '#191F27',
        'brand-border': '#252D37',
        'brand-border-subtle': '#1C232C',
        'brand-accent': '#E9A23B',
        'brand-accent-hover': '#F5B04E',
        'brand-accent-dim': '#C48126',
        'brand-text': '#F3F0E9',
        'brand-muted': '#929BA8',
        'brand-dim': '#5A6472',
        // Legacy backward-compatibility aliases mapped to new palette
        'brand-dark': '#090B0E',
        'brand-panel': '#11151B',
        'brand-card': '#191F27',
        'brand-orange': '#E9A23B',
        'brand-orange-dark': '#C48126',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-accent': '0 0 20px -5px rgba(233, 162, 59, 0.25)',
        'panel': '0 10px 30px -10px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};
