import aspectRatio from '@tailwindcss/aspect-ratio';
import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx,html}'],
  theme: {
    extend: {
      colors: {
        goodGreen: '#1ad66f',
        badRed: '#ff3b30',
        jarGlass: 'rgba(255,255,255,0.35)',
      },
    },
  },
  plugins: [aspectRatio, plugin(() => {})],
};

export default config;

