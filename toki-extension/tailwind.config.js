/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./contents/**/*.tsx", "./popup.tsx", "./shared/**/*.ts"],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        foreground: "#fafafa",
        "accent-sky": "#22d3ee",
        "accent-blue": "#3b82f6",
      },
    },
  },
  plugins: [],
};
