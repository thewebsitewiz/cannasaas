/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  darkMode: ['selector', '[data-color-scheme="dark"]'],
  theme: {
    extend: {
      // All colours are provided by CSS custom properties in tokens.css.
      // Tailwind classes that reference those properties are safe to use.
      fontFamily: {
        heading: ['var(--font-heading)', 'ui-sans-serif', 'system-ui'],
        body:    ['var(--font-body)',    'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};
