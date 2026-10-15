/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#0d9488',
          soft: '#ccfbf1',
          dark: '#0f766e',
        },
        ink: {
          DEFAULT: '#1e293b',
          muted: '#64748b',
          faint: '#94a3b8',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8fafc',
          border: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        display: ['"Libre Baskerville"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
