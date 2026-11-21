/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Light Enterprise Palette
        'brand-bg': '#F7F8FA',             // Main workspace canvas
        'brand-surface': '#FFFFFF',        // Cards, panels, modals
        'brand-surface-subtle': '#F9FAFB', // Table headers, light hover, subtle fills
        'brand-surface-raised': '#F4F5F7', // Segmented controls, chips, elevated elements
        'brand-border': '#E6E8EC',         // Clean 1px borders
        'brand-border-subtle': '#EEF0F3',  // Inner borders, dividers

        // Brand Accent (Warm Ochre / Honey Amber)
        'brand-accent': '#C47A19',
        'brand-accent-hover': '#B26E15',
        'brand-accent-subtle': '#FFF5E8',  // Light background tint
        'brand-accent-border': '#FDE2BC',

        // Typography Color Tokens
        'brand-text': '#20242C',           // Primary text (headings, active values)
        'brand-secondary': '#667085',      // Secondary text (descriptions, body text, labels)
        'brand-muted': '#98A2B3',          // Muted text (placeholders, table headers, icons)
        'brand-disabled': '#D0D5DD',       // Inactive / disabled text

        // Semantic Status Tokens (Light Backgrounds & Restrained Text)
        'status-placed-text': '#1D68BD',
        'status-placed-bg': '#EFF6FF',
        'status-placed-border': '#DBEAFE',

        'status-packed-text': '#B45309',
        'status-packed-bg': '#FFFBEB',
        'status-packed-border': '#FDE68A',

        'status-shipped-text': '#15803D',
        'status-shipped-bg': '#F0FDF4',
        'status-shipped-border': '#BBF7D0',

        'status-cancelled-text': '#B91C1C',
        'status-cancelled-bg': '#FEF2F2',
        'status-cancelled-border': '#FECACA',

        // Backward compatibility mappings
        'brand-dark': '#FFFFFF',
        'brand-panel': '#FFFFFF',
        'brand-card': '#FFFFFF',
        'brand-orange': '#C47A19',
        'brand-orange-dark': '#B26E15',
        'brand-orange-light': '#FFF5E8',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(16, 24, 40, 0.04)',
        'card': '0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px -1px rgba(16, 24, 40, 0.04)',
        'drawer': '-4px 0 24px -2px rgba(16, 24, 40, 0.08)',
        'modal': '0 12px 32px -4px rgba(16, 24, 40, 0.12)',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
      },
    },
  },
  plugins: [],
};