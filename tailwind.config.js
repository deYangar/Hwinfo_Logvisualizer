
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
        neutral: {
          900: '#171717',
          700: '#404040',
          300: '#d4d4d4',
        },
        orange: {
          400: '#fb923c',
        }
      }
    },
  },
  plugins: [],
}
