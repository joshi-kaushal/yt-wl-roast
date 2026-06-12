/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Platypi', 'serif'],
      },
      colors: {
        red: {
          500: "#FF0000"
        }
      }
    },
  },
  plugins: [],
}
