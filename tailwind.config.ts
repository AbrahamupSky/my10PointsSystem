import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'media',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cfa: {
          red: '#E4002B',
          'red-dark': '#C8001E',
          'red-light': '#FF3355',
          surface: 'var(--cfa-surface)',
          card: 'var(--cfa-card)',
          muted: 'var(--cfa-muted)',
          border: 'var(--cfa-border)',
          ink: 'var(--cfa-ink)',
          'ink-soft': 'var(--cfa-ink-soft)',
          'ink-dim': 'var(--cfa-ink-dim)',
        },
      },
    },
  },
  plugins: [],
}

export default config
