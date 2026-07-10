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
        'status-up': {
          DEFAULT: '#10B981', // emerald-500
          container: '#D1FAE5', // emerald-100
          'on-container': '#022C22', // emerald-950
          muted: '#064E3B', // emerald-900
        },
        'status-down': {
          DEFAULT: '#EF4444', // red-500
          container: '#FEE2E2', // red-100
          'on-container': '#450A0A', // red-950
          muted: '#7F1D1D', // red-900
        },
        'status-degraded': {
          DEFAULT: '#F59E0B', // amber-500
          container: '#FEF3C7', // amber-100
          'on-container': '#451A03', // amber-950
          muted: '#78350F', // amber-900
        },
        'status-paused': {
          DEFAULT: '#0EA5E9', // sky-500
          container: '#E0F2FE', // sky-100
          'on-container': '#082F49', // sky-950
          muted: '#0C4A6E', // sky-900
        },
        'status-starting': {
          DEFAULT: '#6366F1', // indigo-500
          container: '#E0E7FF', // indigo-100
          'on-container': '#1E1B4B', // indigo-950
          muted: '#312E81', // indigo-900
        },
        'status-unknown': {
          DEFAULT: '#94A3B8', // slate-400
          container: '#F1F5F9', // slate-100
          'on-container': '#0F172A', // slate-900
          muted: '#334155', // slate-700
        },
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
        'elevation-1': '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)',
        'elevation-2': '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 2px 6px 2px rgba(0, 0, 0, 0.15)',
        'elevation-3': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 4px 8px 3px rgba(0, 0, 0, 0.15)',
        'elevation-4': '0 2px 3px 0 rgba(0, 0, 0, 0.3), 0 6px 10px 4px rgba(0, 0, 0, 0.15)',
        'elevation-5': '0 4px 4px 0 rgba(0, 0, 0, 0.3), 0 8px 12px 6px rgba(0, 0, 0, 0.15)',
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

      const rgbValues = hexToRgb(primaryColor);

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
