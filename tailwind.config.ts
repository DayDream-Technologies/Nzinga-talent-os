import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: { bg: '#f0f2f5' },
        card: { bg: '#ffffff', border: '#e2e5ea' },
        input: { bg: '#f7f8fa', border: '#d1d5db' },
        nav: { bg: '#1a2332', border: '#243044', text: '#94a3b8' },
        accent: '#1d6fa4',
        t1: '#111827',
        t2: '#374151',
        t3: '#6b7280',
        t4: '#9ca3af',
        t5: '#d1d5db',
        purple: { DEFAULT: '#7c3aed', light: '#ede9fe' },
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
