/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'Segoe UI',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        blueglass: {
          50: '#eaf6ff',
          100: '#c7e6ff',
          200: '#8fd0ff',
          300: '#4bb6ff',
          400: '#2196f3',
          500: '#1565c0',
          600: '#0d47a1',
          700: '#0a3570',
          800: '#0a2540',
          900: '#08182b',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.18)',
        },
        dark: {
          900: '#0a192f',
          950: '#050d1a',
        },
        white: '#fff',
        black: '#000',
        success: {
          400: '#4ade80',
          500: '#22c55e',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
        },
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
      borderRadius: {
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
        'card': '0 4px 24px 0 rgba(0,0,0,0.25)',
        'glow-cyan': '0 0 6px 0 #22d3ee22',
        'glow-blue': '0 0 6px 0 #2196f322',
      },
      backgroundImage: {
        'blue-glass-gradient': 'linear-gradient(135deg, #0a2540 0%, #1565c0 100%)',
        'blue-glass-radial': 'radial-gradient(circle at 60% 40%, #2196f3 0%, #0a2540 100%)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
} 