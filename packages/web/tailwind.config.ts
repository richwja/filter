import type { Config } from 'tailwindcss';
import tailwindAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Geist',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        // Filter brand — pink accents from Measure palette
        pink: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        // Dark base palette
        surface: {
          DEFAULT: '#0f1117',
          50: '#1a1d27',
          100: '#1e2231',
          200: '#252a3a',
          300: '#2e3447',
          400: '#3a4159',
          500: '#4a526b',
          600: '#6b7394',
          700: '#8b93b0',
          800: '#b0b7cd',
          900: '#d5d9e6',
          950: '#eceef4',
        },
        // Sentiment colours from Measure
        sentiment: {
          positive: '#0f766e',
          neutral: '#6d5bae',
          negative: '#9f1239',
        },
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      letterSpacing: {
        body: '-0.01em',
        heading: '-0.02em',
      },
    },
  },
  plugins: [tailwindAnimate],
};

export default config;
