/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        arcade: ['"VT323"', 'monospace'],
        mono: ['"Space Mono"', '"Courier New"', 'monospace'],
      },
      boxShadow: {
        'pixel': '4px 4px 0px var(--border-color)',
        'pixel-sm': '2px 2px 0px var(--border-color)',
        'pixel-glow': 'var(--glow-shadow, 4px 4px 0px var(--border-color))',
      },
    },
  },
  plugins: [],
}
