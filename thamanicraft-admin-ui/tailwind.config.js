/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D97706',
          hover: '#B45309',
          active: '#92400E',
        },
        sidebar: {
          bg: {
            light: '#0F172A',
            dark: '#020617',
          },
        },
        app: {
          light: '#F8FAFC',
          dark: '#0B1120',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1E293B',
        },
        border: {
          light: '#E2E8F0',
          dark: '#334155',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#0284C7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },
      spacing: {
        'touch-min': '48px',
      },
      borderRadius: {
        'card': '12px',
        'modal': '16px',
      }
    },
  },
  plugins: [],
}
