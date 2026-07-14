import plugin from 'tailwindcss/plugin'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Material 3 Semantic Colors mapped directly to CSS variables
        primary: 'var(--md-sys-color-primary)',
        'on-primary': 'var(--md-sys-color-on-primary)',
        'primary-container': 'var(--md-sys-color-primary-container)',
        'on-primary-container': 'var(--md-sys-color-on-primary-container)',
        secondary: 'var(--md-sys-color-secondary)',
        'on-secondary': 'var(--md-sys-color-on-secondary)',
        'secondary-container': 'var(--md-sys-color-secondary-container)',
        'on-secondary-container': 'var(--md-sys-color-on-secondary-container)',
        tertiary: 'var(--md-sys-color-tertiary)',
        'on-tertiary': 'var(--md-sys-color-on-tertiary)',
        'tertiary-container': 'var(--md-sys-color-tertiary-container)',
        'on-tertiary-container': 'var(--md-sys-color-on-tertiary-container)',
        error: 'var(--md-sys-color-error)',
        'on-error': 'var(--md-sys-color-on-error)',
        'error-container': 'var(--md-sys-color-error-container)',
        'on-error-container': 'var(--md-sys-color-on-error-container)',
        background: 'var(--md-sys-color-background)',
        'on-background': 'var(--md-sys-color-on-background)',
        surface: 'var(--md-sys-color-surface)',
        'on-surface': 'var(--md-sys-color-on-surface)',
        'on-surface-variant': 'var(--md-sys-color-on-surface-variant)',
        'surface-container-lowest': 'var(--md-sys-color-surface-container-lowest)',
        'surface-container-low': 'var(--md-sys-color-surface-container-low)',
        'surface-container': 'var(--md-sys-color-surface-container)',
        'surface-container-high': 'var(--md-sys-color-surface-container-high)',
        'surface-container-highest': 'var(--md-sys-color-surface-container-highest)',
        'surface-dim': 'var(--md-sys-color-surface-dim)',
        'surface-bright': 'var(--md-sys-color-surface-bright)',
        outline: 'var(--md-sys-color-outline)',
        'outline-variant': 'var(--md-sys-color-outline-variant)',
        'inverse-surface': 'var(--md-sys-color-inverse-surface)',
        'inverse-on-surface': 'var(--md-sys-color-inverse-on-surface)',
        'inverse-primary': 'var(--md-sys-color-inverse-primary)',
        // Legacy Brand mappings mapped to CSS variables
        'brand-bg-primary': 'var(--color-brand-bg-primary)',
        'brand-bg-secondary': 'var(--color-brand-bg-secondary)',
        'brand-bg-tertiary': 'var(--color-brand-bg-tertiary)',
        'brand-bg-quaternary': 'var(--color-brand-bg-quaternary)',
        'brand-btn-primary': 'var(--color-brand-btn-primary)',
        'brand-btn-border-primary': 'var(--color-brand-btn-border-primary)',
        'brand-btn-secondary': 'var(--color-brand-btn-secondary)',
        'brand-btn-border-secondary': 'var(--color-brand-btn-border-secondary)',
        'brand-btn-quaternary': 'var(--color-brand-btn-quaternary)',
        'brand-text': 'var(--color-brand-text)',
        'brand-accent': 'var(--color-brand-accent)',
        'brand-link': 'var(--color-brand-link)',
        'brand-hover': 'var(--color-brand-hover)',
        'brand-active': 'var(--color-brand-active)',
        'calendar-today-bg': 'var(--color-calendar-today-bg)',
        'status-up': {
          DEFAULT: 'var(--color-status-up)',
          container: 'var(--color-status-up-container)',
          'container-hover': 'var(--color-status-up-container-hover)',
          'on-container': 'var(--color-status-up-on-container)',
          muted: 'var(--color-status-up-muted)',
        },
        'status-down': {
          DEFAULT: 'var(--color-status-down)',
          container: 'var(--color-status-down-container)',
          'container-hover': 'var(--color-status-down-container-hover)',
          'on-container': 'var(--color-status-down-on-container)',
          muted: 'var(--color-status-down-muted)',
        },
        'status-degraded': {
          DEFAULT: 'var(--color-status-degraded)',
          container: 'var(--color-status-degraded-container)',
          'container-hover': 'var(--color-status-degraded-container-hover)',
          'on-container': 'var(--color-status-degraded-on-container)',
          muted: 'var(--color-status-degraded-muted)',
        },
        'status-paused': {
          DEFAULT: 'var(--color-status-paused)',
          container: 'var(--color-status-paused-container)',
          'container-hover': 'var(--color-status-paused-container-hover)',
          'on-container': 'var(--color-status-paused-on-container)',
          muted: 'var(--color-status-paused-muted)',
        },
        'status-starting': {
          DEFAULT: 'var(--color-status-starting)',
          container: 'var(--color-status-starting-container)',
          'container-hover': 'var(--color-status-starting-container-hover)',
          'on-container': 'var(--color-status-starting-on-container)',
          muted: 'var(--color-status-starting-muted)',
        },
        'status-unknown': {
          DEFAULT: 'var(--color-status-unknown)',
          container: 'var(--color-status-unknown-container)',
          'container-hover': 'var(--color-status-unknown-container-hover)',
          'on-container': 'var(--color-status-unknown-on-container)',
          muted: 'var(--color-status-unknown-muted)',
        },
        'chart-grid': 'var(--color-chart-grid)',
        'chart-tick': 'var(--color-chart-tick)',
        'chart-prev-line': 'var(--color-chart-prev-line)',
        'chart-label': 'var(--color-chart-label)',
        'chart-1': 'var(--color-chart-1)',
        'chart-2': 'var(--color-chart-2)',
        'chart-3': 'var(--color-chart-3)',
        'growth': 'var(--color-growth)',
        'decline': 'var(--color-decline)',
        'decline-warning': 'var(--color-decline-warning)',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'elevation-1': '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)',
        'elevation-2': '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 2px 6px 2px rgba(0, 0, 0, 0.15)',
        'elevation-3': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 4px 8px 3px rgba(0, 0, 0, 0.15)',
        'elevation-4': '0 2px 3px 0 rgba(0, 0, 0, 0.3), 0 6px 10px 4px rgba(0, 0, 0, 0.15)',
        'elevation-5': '0 4px 4px 0 rgba(0, 0, 0, 0.3), 0 8px 12px 6px rgba(0, 0, 0, 0.15)',
        'status-up-glow': '0 0 8px var(--color-status-up-glow)',
        'status-down-glow': '0 0 8px var(--color-status-down-glow)',
        'status-degraded-glow': '0 0 8px var(--color-status-degraded-glow)',
        'status-unknown-glow': '0 0 8px var(--color-status-unknown-glow)',
        'status-paused-glow': '0 0 6px var(--color-status-paused-glow)',
        'status-starting-glow': '0 0 6px var(--color-status-starting-glow)',
      },
      screens: {
        'contained': { 'raw': '(min-width: 1024px) and (min-height: 950px) and (orientation: landscape), (min-width: 1024px) and (min-height: 1350px) and (orientation: portrait)' },
        'landscape-lg': { 'raw': '(orientation: landscape) and (min-width: 1024px)' },
        'portrait-lg': { 'raw': '(orientation: portrait) and (min-width: 1024px)' },
        'landscape-contained': { 'raw': '(orientation: landscape) and (min-width: 1024px) and (min-height: 950px)' },
        'portrait-contained': { 'raw': '(orientation: portrait) and (min-width: 1024px) and (min-height: 1350px)' }
      }
    },
  },
  plugins: [
    plugin(function({ addComponents, theme }) {
      const spacing = theme('spacing') || {};
      const flexGapComponents = {};
      const breakpoints = {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px'
      };
      
      Object.entries(spacing).forEach(([key, value]) => {
        const escapedKey = key.replace('.', '\\.');
        
        // Standard Flex Gap Fallback (No-Wrap)
        flexGapComponents[`.flex.gap-${escapedKey} > :not([hidden]) ~ :not([hidden])`] = {
          'margin-left': value,
          'margin-top': '0px',
        };
        flexGapComponents[`.flex.flex-col.gap-${escapedKey} > :not([hidden]) ~ :not([hidden])`] = {
          'margin-top': value,
          'margin-left': '0px',
        };
        flexGapComponents[`.flex.gap-x-${escapedKey} > :not([hidden]) ~ :not([hidden])`] = {
          'margin-left': value,
        };
        flexGapComponents[`.flex.gap-y-${escapedKey} > :not([hidden]) ~ :not([hidden])`] = {
          'margin-top': value,
        };

        // Responsive overrides for direction changes (e.g. flex-col sm:flex-row)
        Object.entries(breakpoints).forEach(([bp, minWidth]) => {
          const bpKey = `@media (min-width: ${minWidth})`;
          flexGapComponents[bpKey] = flexGapComponents[bpKey] || {};
          
          const escapedBp = bp === '2xl' ? '\\32 xl' : bp;
          
          // col -> row at bp
          flexGapComponents[bpKey][`.flex.flex-col.${escapedBp}\\:flex-row.gap-${escapedKey} > :not([hidden]) ~ :not([hidden])`] = {
            'margin-top': '0px',
            'margin-left': value,
          };
          
          // row -> col at bp
          flexGapComponents[bpKey][`.flex.${escapedBp}\\:flex-col.gap-${escapedKey} > :not([hidden]) ~ :not([hidden])`] = {
            'margin-top': value,
            'margin-left': '0px',
          };
        });

        // Wrap Flex Gap Fallback (Negative Margin Hack)
        flexGapComponents[`.flex.flex-wrap.gap-${escapedKey}`] = {
          'margin': `calc(${value} / -2)`,
        };
        flexGapComponents[`.flex.flex-wrap.gap-x-${escapedKey}`] = {
          'margin-left': `calc(${value} / -2)`,
          'margin-right': `calc(${value} / -2)`,
        };
        flexGapComponents[`.flex.flex-wrap.gap-y-${escapedKey}`] = {
          'margin-top': `calc(${value} / -2)`,
          'margin-bottom': `calc(${value} / -2)`,
        };

        // Children positive margins
        flexGapComponents[`.flex.flex-wrap.gap-${escapedKey} > *`] = {
          'margin': `calc(${value} / 2)`,
        };
        flexGapComponents[`.flex.flex-wrap.gap-x-${escapedKey} > *`] = {
          'margin-left': `calc(${value} / 2)`,
          'margin-right': `calc(${value} / 2)`,
        };
        flexGapComponents[`.flex.flex-wrap.gap-y-${escapedKey} > *`] = {
          'margin-top': `calc(${value} / 2)`,
          'margin-bottom': `calc(${value} / 2)`,
        };

        // Re-assert wrapping margins on siblings (overrides non-wrapping sibling rules)
        flexGapComponents[`.flex.flex-wrap.gap-${escapedKey} > :not([hidden]) ~ :not([hidden])`] = {
          'margin': `calc(${value} / 2)`,
        };
        flexGapComponents[`.flex.flex-wrap.gap-x-${escapedKey} > :not([hidden]) ~ :not([hidden])`] = {
          'margin-left': `calc(${value} / 2)`,
        };
        flexGapComponents[`.flex.flex-wrap.gap-y-${escapedKey} > :not([hidden]) ~ :not([hidden])`] = {
          'margin-top': `calc(${value} / 2)`,
        };
      });
      
      addComponents(flexGapComponents);
    }),
    plugin(function({ addUtilities, theme }) {
      const primaryColor = theme('colors.brand-btn-primary') || '#04686D';
      
      const hexToRgb = (hex) => {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
        return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '4 104 109';
      };

      // const rgbValues = hexToRgb(primaryColor);

      const rgbValues = '';
      const elevations = {
        '.m3-elevation-0': {
          boxShadow: 'none',
          backgroundImage: 'none',
        },
        '.m3-elevation-1': {
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)',
          backgroundImage: `linear-gradient(rgba(${rgbValues} / 0.05), rgba(${rgbValues} / 0.05))`,
        },
        '.m3-elevation-2': {
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 2px 6px 2px rgba(0, 0, 0, 0.15)',
          backgroundImage: `linear-gradient(rgba(${rgbValues} / 0.08), rgba(${rgbValues} / 0.08))`,
        },
        '.m3-elevation-3': {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 4px 8px 3px rgba(0, 0, 0, 0.15)',
          backgroundImage: `linear-gradient(rgba(${rgbValues} / 0.11), rgba(${rgbValues} / 0.11))`,
        },
        '.m3-elevation-4': {
          boxShadow: '0 2px 3px 0 rgba(0, 0, 0, 0.3), 0 6px 10px 4px rgba(0, 0, 0, 0.15)',
          backgroundImage: `linear-gradient(rgba(${rgbValues} / 0.12), rgba(${rgbValues} / 0.12))`,
        },
        '.m3-elevation-5': {
          boxShadow: '0 4px 4px 0 rgba(0, 0, 0, 0.3), 0 8px 12px 6px rgba(0, 0, 0, 0.15)',
          backgroundImage: `linear-gradient(rgba(${rgbValues} / 0.14), rgba(${rgbValues} / 0.14))`,
        },
      };

      addUtilities(elevations, ['hover', 'focus', 'responsive']);
    })
  ],
}
