/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0D0F',
          sidebar: '#121417',
          card: '#1A1D21',
          header: '#1E2227',
          border: '#2A2F35',
          active: '#2A3942'
        },
        primary: {
          DEFAULT: '#00A884',
          hover: '#008F6F'
        },
        secondary: {
          text: '#8696A0',
          hover: '#202C33'
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
