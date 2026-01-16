/** @type {import('tailwindcss').Config} */
module.exports = {

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx"
  ],

  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
colors: {
  // Master Theme Colors
  parchment: 'rgb(var(--rgb-parchment) / <alpha-value>)',
  ink: 'rgb(var(--rgb-ink) / <alpha-value>)',
  primary: 'rgb(var(--rgb-primary) / <alpha-value>)',
  'mica-surface': 'rgb(var(--rgb-mica) / <alpha-value>)',

  // The Earth Rainbow (Now accessible to the whole app!)
  rose: 'rgb(var(--rgb-rose) / <alpha-value>)',
  gold: 'rgb(var(--rgb-gold) / <alpha-value>)',
  peach: 'rgb(var(--rgb-peach) / <alpha-value>)',
  moss: 'rgb(var(--rgb-moss) / <alpha-value>)',
  plum: 'rgb(var(--rgb-plum) / <alpha-value>)',

},
    fontFamily: {
        // Elegant Serif for book titles
        header: ['"Cormorant Garamond"', 'serif'], 
        sans: ['Inter', 'sans-serif'], 
      },

      boxShadow: {
        '3d': '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
        '3d-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } }
      }
    },
  },
  plugins: [],
}

