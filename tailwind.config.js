/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,js,jsx,ts,tsx}"], // Asegura que escanee los archivos correctos
    theme: {
      extend: {
        colors: {
          background: 'var(--background)',
          foreground: 'var(--foreground)',
        },
        fontFamily: {
          sans: ['Geist Sans', 'sans-serif'],
          mono: ['Geist Mono', 'monospace'],
        },
      },
    },
    plugins: [],
  };
  