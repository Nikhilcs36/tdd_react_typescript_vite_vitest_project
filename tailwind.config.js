/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: "#1a202c",
          secondary: "#2d3748",
          text: "#e2e8f0",
          accent: "#4a5568",
        },
      },
    },
  },
  plugins: [],
};
