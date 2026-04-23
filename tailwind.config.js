/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0D0D0D',
        cream:  '#FAF7F0',
        brand: {
          DEFAULT: '#F5A623',
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
