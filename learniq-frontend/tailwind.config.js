/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Outfit', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: {
          light: '#f8fafc', // Fine architectural slate-50 canvas
          dark: '#0b0d11',  // Deep Obsidian / Slate Canvas
        },
        surface: {
          light: '#ffffff',    // Pure White Card Surface
          dark: '#13171f',     // Elevated Dark Card Surface
          elevated: '#1a1f2b', // Higher Elevation Panels & Dialogs
          subtle: '#161b24',   // Row hovers, subtle inputs
        },
        border: {
          light: '#e2e8f0',    // Graphite border light
          subtle: '#eaecf0',   // Subtle border light
          dark: '#232936',     // Fine 1px dark border
        },
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd', // Soft lavender
          400: '#a78bfa',
          500: '#8b5cf6', // Bright accent
          600: '#7c3aed', // Interactive purple
          700: '#6d28d9', // Primary violet
          800: '#5b21b6', // Deep violet hover
          900: '#4c1d95',
          950: '#2e1065',
        },
        achievement: {
          amber: '#f59e0b',
          gold: '#d97706',
          deep: '#b45309',
        },
        success: {
          emerald: '#10b981',
          deep: '#059669',
        },
        academy: {
          paper: 'var(--academy-paper)',
          'paper-subtle': 'var(--academy-paper-subtle)',
          card: 'var(--academy-card)',
          ink: 'var(--academy-ink)',
          'ink-secondary': 'var(--academy-ink-secondary)',
          muted: 'var(--academy-muted)',
          rule: 'var(--academy-rule)',
          'rule-subtle': 'var(--academy-rule-subtle)',
          accent: 'var(--academy-accent)',
          'accent-hover': 'var(--academy-accent-hover)',
          'accent-tint': 'var(--academy-accent-tint)',
          'accent-deep': 'var(--academy-accent-deep)',
        },
        accent: 'rgb(var(--accent))',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'skeuo': '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
        'skeuo-dark': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.4)',
        'modal': '0 24px 48px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        'modal-dark': '0 28px 60px -12px rgba(0, 0, 0, 0.65), inset 0 1px 0 0 rgba(255, 255, 255, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.04)',
      },
      zIndex: {
        'modal': '50',
        'backdrop': '40',
        'toolbar': '30',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
