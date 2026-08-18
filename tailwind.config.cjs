module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}', './aurasense.tsx'],
  theme: {
    extend: {},
  },
  plugins: [require('tailwindcss-animate')],
};