/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 15px 40px -20px rgba(17, 24, 39, 0.45)",
      },
    },
  },
  plugins: [],
};
