import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: { bg: 'var(--color-page-bg)' },
        card: { bg: 'var(--color-card-bg)', border: 'var(--color-card-border)' },
        input: { bg: 'var(--color-input-bg)', border: 'var(--color-input-border)' },
        muted: { bg: 'var(--color-muted-bg)' },
        elevated: { bg: 'var(--color-elevated-bg)' },
        nav: {
          bg: 'var(--color-nav-bg)',
          border: 'var(--color-nav-border)',
          text: 'var(--color-nav-text)',
        },
        accent: 'var(--color-accent)',
        t1: 'var(--color-t1)',
        t2: 'var(--color-t2)',
        t3: 'var(--color-t3)',
        t4: 'var(--color-t4)',
        t5: 'var(--color-t5)',
        purple: { DEFAULT: '#7c3aed', light: 'var(--color-brand-purple-light)' },
        stage: {
          holding: '#7c3aed',
          scout: '#a855f7',
          team1: '#d97706',
          ops: '#2563eb',
          team2: '#0891b2',
          executive: '#059669',
          signed: '#16a34a',
          archived: '#6b7280',
          notViable: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
    },
  },
} satisfies Config
