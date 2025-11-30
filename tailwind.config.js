/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fefdf7',
          100: '#fdf9e7',
          200: '#faf0c4',
          300: '#f5e29a',
          400: '#efd06a',
          500: '#e8bc3c',
          600: '#d4a32e',
          700: '#b08526',
          800: '#8e6a25',
          900: '#745722',
        },
        midnight: {
          50: '#f4f6f9',
          100: '#e9edf3',
          200: '#c8d2e0',
          300: '#a7b7cd',
          400: '#6580a7',
          500: '#234a81',
          600: '#1f4274',
          700: '#1a3761',
          800: '#142c4e',
          900: '#0d1f38',
          950: '#080f1c',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Outfit', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}

