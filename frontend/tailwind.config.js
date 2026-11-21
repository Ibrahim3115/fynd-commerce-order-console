/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core Surfaces & Borders
        'brand-bg': '#090B0E',
        'brand-surface': '#11151B',
        'brand-surface-raised': '#191F27',
        'brand-surface-2': '#191F27',
        'brand-border': '#252D37',
        'brand-border-subtle': '#1C232C',
        
        // Brand Accent
        'brand-accent': '#E9A23B',
        'brand-accent-hover': '#F5B04E',
        'brand-accent-dim': '#C48126',
        
        // Consistent Text Tokens
        'brand-text': '#E8EAF0',       // Primary text (headings, active values, high contrast)
        'brand-secondary': '#A0A7B4',  // Secondary text (descriptions, regular labels, dates)
        'brand-muted': '#737D8C',      // Muted text (secondary metadata, table headers, placeholders)
        'brand-disabled': '#555F6D',   // Disabled text
        
        // Semantic Restrained Status Tokens
        'brand-success': '#22C55E',
        'brand-success-dim': 'rgba(34, 197, 94, 0.12)',
        'brand-success-border': 'rgba(34, 197, 94, 0.25)',
        
        'brand-warning': '#F59E0B',
        'brand-warning-dim': 'rgba(245, 158, 11, 0.12)',
        'brand-warning-border': 'rgba(245, 158, 11, 0.25)',
        
        'brand-danger': '#EF4444',
        'brand-danger-dim': 'rgba(239, 68, 68, 0.12)',
        'brand-danger-border': 'rgba(239, 68, 68, 0.25)',

        // Backward compatibility mappings
        'brand-dark': '#090B0E',
        'brand-panel': '#11151B',
        'brand-card': '#191F27',
        'brand-orange': '#E9A23B',
        'brand-orange-dark': '#C48126',
        'brand-orange-light': '#F5B04E',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'page-title': ['26px', { lineHeight: '32px', fontWeight: '600', letterSpacing: '-0.02em' }],
        'section-title': ['18px', { lineHeight: '24px', fontWeight: '600', letterSpacing: '-0.01em' }],
        'card-title': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'body': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'secondary': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'table-header': ['11px', { lineHeight: '14px', fontWeight: '500' }],
        'btn': ['13px', { lineHeight: '16px', fontWeight: '500' }],
        'kpi': ['28px', { lineHeight: '34px', fontWeight: '600', letterSpacing: '-0.02em' }],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.35)',
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