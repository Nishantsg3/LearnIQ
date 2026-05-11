/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        violet: {
          500: 'rgb(var(--accent))',
          400: 'rgba(var(--accent), 0.8)',
          600: 'rgba(var(--accent), 1.2)',
        },
        accent: 'rgb(var(--accent))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
