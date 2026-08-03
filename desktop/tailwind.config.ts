import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',
        success: '#059669',
        warning: '#d97706',
        danger: '#dc2626',
        accent: '#e1198f',
        pop: '#ff6a3d',
        bg: '#f8fafc',
        surface: '#ffffff',
        border: '#e2e8f0',
        text: '#0f172a',
        muted: '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '6px',
        input: '4px',
        modal: '8px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
export default config
