/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        cream:  'var(--color-cream)',
        brand: {
          DEFAULT: 'var(--color-brand)',
          dark:    '#D98E1A',
          light:   '#FDF1DB',
        },
        delivery: {
          DEFAULT: '#D85A30',
          dark:    '#993C1D',
          light:   '#FAECE7',
        },
        staff: {
          DEFAULT: '#185FA5',
          light:   '#E6F1FB',
        },
      },
      fontFamily: {
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        display: ['Clash Display', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
