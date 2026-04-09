/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", //
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"Aptos"', '"Segoe UI"', "Tahoma", "sans-serif"],
        serif: ['"Inter"', '"Aptos"', '"Segoe UI"', "Tahoma", "sans-serif"],
        display: ['"Inter"', '"Aptos"', '"Segoe UI"', "Tahoma", "sans-serif"],
        ui: ['"Inter"', '"Aptos"', '"Segoe UI"', "Tahoma", "sans-serif"],
      },
    },
  },
  plugins: [],
};
