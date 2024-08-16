/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
       fontFamily: {
        'serif': ['Platypi', 'serif'],
      },
      colors: {
        ...colors,
        red: {
          500: "#FF0000"
        }
      }
    },
  },
  plugins: [],
}