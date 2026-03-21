/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  'var(--color-primary-xlight)',
          100: 'var(--color-primary-light)',
          400: 'var(--color-accent)',
          500: 'var(--color-primary)',
          600: 'var(--color-primary-hover)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          alt:     'var(--color-surface-alt)',
          hover:   'var(--color-surface-hover)',
        },
        bg: {
          DEFAULT: 'var(--color-bg)',
          alt:     'var(--color-bg-alt)',
        },
        txt: {
          DEFAULT:   'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          muted:     'var(--color-text-muted)',
          faint:     'var(--color-text-faint)',
          inverse:   'var(--color-text-inverse)',
        },
        bdr: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
          focus:   'var(--color-border-focus)',
        },
        danger:  { DEFAULT: 'var(--color-danger)',  bg: 'var(--color-danger-bg)' },
        success: { DEFAULT: 'var(--color-success)', bg: 'var(--color-success-bg)' },
        warning: { DEFAULT: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
        info:    { DEFAULT: 'var(--color-info)',     bg: 'var(--color-info-bg)' },
        gs: {
          pine:       'var(--gs-pine)',
          'deep-pine':'var(--gs-deep-pine)',
          forest:     'var(--gs-forest)',
          charcoal:   'var(--gs-charcoal)',
          ink:        'var(--gs-ink)',
          cream:      'var(--gs-cream)',
          fog:        'var(--gs-fog)',
          mist:       'var(--gs-mist)',
        },
      },
      fontFamily: {
        body:    'var(--font-body)',
        display: 'var(--font-display)',
        mono:    'var(--font-mono)',
      },
    },
  },
  plugins: [],
};
