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
        'brand-bg-primary': '#ffffff',
        'brand-bg-secondary': '#022d2e',
        'brand-bg-tertiary': '#ffffff',
        'brand-bg-quaternary': '#034b4e',
        'brand-btn-primary': '#04686D',
        'brand-btn-border-primary': '#04686D',
        'brand-btn-secondary': '#ffffff',
        'brand-btn-border-secondary': '#06959B',
        'brand-btn-quaternary': '#034b4e',
        'brand-text': '#022D2E',
        'brand-accent': '#FFCE44',
        'brand-link': '#06959B',
        'status-up': '#10B981',
        'status-down': '#EF4444',
        'status-degraded': '#F59E0B',
        'chart-grid': '#f1f5f9',
        'chart-tick': '#94a3b8',
        'chart-prev-line': '#cbd5e1',
        'chart-label': '#1A1A1A',
        'chart-1': '#0ea5e9',
        'chart-2': '#8b5cf6',
        'chart-3': '#51B5B9',
        'growth': '#37b24d',
        'decline': '#f03e3e',
        'decline-warning': '#f59f00',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      screens: {
        'contained': { 'raw': '(min-width: 1024px) and (min-height: 900px) and (orientation: landscape), (min-width: 1024px) and (min-height: 1350px) and (orientation: portrait)' },
        'landscape-lg': { 'raw': '(orientation: landscape) and (min-width: 1024px)' },
        'portrait-lg': { 'raw': '(orientation: portrait) and (min-width: 1024px)' },
        'landscape-contained': { 'raw': '(orientation: landscape) and (min-width: 1024px) and (min-height: 900px)' },
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
    })
  ],
}
