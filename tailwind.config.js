/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}", // Explicitly checking your components folder
    "./*.{js,ts,jsx,tsx}" // Checking root files like App.tsx if it's there
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        parchment: 'rgb(var(--rgb-parchment) / <alpha-value>)',
        ink: 'rgb(var(--rgb-ink) / <alpha-value>)',
        'mica-surface': 'rgb(var(--rgb-mica) / <alpha-value>)',
        brand: {
          deep: '#011D4D',
          cyan: '#1282A2',
          glow: '#4A9EA6',
        },
        plum: '#63372C',
        rose: '#D1345B',
        gold: '#C5A028',
        sunset: '#9A463D',
        md: {
          sys: {
            primary: 'rgb(var(--rgb-primary) / <alpha-value>)',
            surface: 'rgb(var(--rgb-parchment) / <alpha-value>)',
            onSurface: 'rgb(var(--rgb-ink) / <alpha-value>)',
          }
        }
      },
      fontFamily: {
        header: ['"Merriweather"', 'serif'],
        sans: ['"Instrument Sans"', 'sans-serif'],
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

