/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 1px 4px 0 rgba(0,0,0,0.07)',
        modal: '0 8px 32px 0 rgba(0,0,0,0.14)',
      },
    },
  },
  plugins: [],
}
