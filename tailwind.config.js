/** @type {import('tailwindcss').Config} */
export default {
  content: [],
  content: ['./src/**/*.{html,svelte,js,ts}'],
  theme: {
    extend: {},
  },
  plugins: [],
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark', 'pastel'],
  },
};
