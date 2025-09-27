const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,html}'
  ],
  theme: {
    extend: {
      colors: {
        goodGreen: '#1ad66f',
        badRed: '#ff3b30',
        jarGlass: 'rgba(255,255,255,0.35)'
      }
    }
  },
  plugins: [require('@tailwindcss/aspect-ratio'), plugin(function() {})]
};
