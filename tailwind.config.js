/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#E8651A',
        'primary-light': '#FDF0E8',
      },
    },
  },
  plugins: [],
}
