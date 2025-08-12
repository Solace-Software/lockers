/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'SF Pro Display',
          'SF Pro Icons',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif'
        ],
      },
      colors: {
        app: {
          // Main background colors
          bg: {
            primary: '#F5F5F7',    // Main background
            secondary: '#FFFFFF',   // Card/component background
            tertiary: '#F9F9FB',   // Alternative background
          },
          // Text colors - All dark for light theme
          text: {
            primary: '#000000',    // Main text color
            secondary: '#1D1D1F',  // Secondary text
            tertiary: '#484848',   // Less important text
            placeholder: '#8E8E93', // Form placeholders
          },
          // Border colors
          border: {
            DEFAULT: '#D1D1D6',    // Standard borders
            focus: '#0066DD',      // Focus state
          },
          // Primary action color
          blue: {
            DEFAULT: '#0066DD',    // Primary actions
            dark: '#004FB3',       // Hover state
          },
          // Status colors
          status: {
            success: {
              bg: '#F1F9F1',
              border: '#34A853',
              text: '#1E5928',
            },
            warning: {
              bg: '#FEF8E7',
              border: '#F9AB00',
              text: '#93640A',
            },
            error: {
              bg: '#FDEDEF',
              border: '#EA4335',
              text: '#B31412',
            },
            info: {
              bg: '#EFF6FE',
              border: '#4285F4',
              text: '#1A5ABC',
            },
          },
          // Interactive states
          interactive: {
            hover: '#F5F5F7',
            active: '#EBEBEB',
          },
        },
      },
      // Consistent shadows
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.1)',
        'button': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'button-hover': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'dropdown': '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      // Standardized border radius
      borderRadius: {
        DEFAULT: '8px',      // Base radius for most elements
        'lg': '10px',        // Larger components
        'full': '9999px',    // Circular elements
      },
    },
  },
  plugins: [],
}