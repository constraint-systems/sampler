/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    'bg-yellow-500',
    'border-yellow-500',
    'bg-orange-500',
    'border-orange-500',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
