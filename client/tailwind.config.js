/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,css}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'deep-navy': '#071952',
        'dark-teal': '#088395',
        'light-teal': '#37B7C3',
        'ice-white': '#EBF4F6',
        background: '#f2fbfd',
        'pure-white': '#FFFFFF',
        primary: '#006574',
        'primary-container': '#008092',
        'primary-fixed': '#a3eeff',
        'primary-fixed-dim': '#76d4e7',
        'surface-tint': '#006877',
        secondary: '#006971',
        'secondary-container': '#7cf1fd',
        tertiary: '#4b5993',
        outline: '#6e797c',
        'outline-variant': '#bdc8cb',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#ecf5f7',
        'surface-container': '#e6eff1',
        'surface-container-high': '#e1eaec',
        'surface-container-highest': '#dbe4e6',
        'surface-variant': '#dbe4e6',
        'on-surface': '#141d1f',
        'on-surface-variant': '#3e494b',
        'on-background': '#141d1f',
        'on-primary': '#ffffff',
        'on-primary-container': '#f8fdff',
        'on-primary-fixed': '#001f25',
        'on-primary-fixed-variant': '#004e5a',
        'inverse-surface': '#293234',
        'inverse-on-surface': '#e9f2f4',
        'inverse-primary': '#76d4e7',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
        'status-aman': '#22C55E',
        'status-perhatian': '#FACC15',
        'status-berisiko': '#EF4444',
        'status-abk': '#A855F7'
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      },
      spacing: {
        'stack-sm': '0.5rem',
        'stack-md': '1rem',
        'stack-lg': '2rem',
        gutter: '1.5rem',
        'card-padding': '1.5rem',
        'section-padding': '4rem',
        'container-max': '1280px',
        'sidebar-width': '250px',
        'sidebar-collapsed-width': '72px'
      },
      fontFamily: {
        sans: ['Hanken Grotesk', 'system-ui', 'sans-serif'],
        'label-sm': ['Hanken Grotesk'],
        'label-md': ['Hanken Grotesk'],
        'body-md': ['Hanken Grotesk'],
        'body-lg': ['Hanken Grotesk'],
        'title-lg': ['Hanken Grotesk'],
        'headline-md': ['Hanken Grotesk'],
        'headline-lg': ['Hanken Grotesk'],
        'display-hero': ['Hanken Grotesk']
      },
      fontSize: {
        'label-sm': ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
        'label-md': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em', fontWeight: '600' }],
        'body-md': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }],
        'title-lg': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'headline-md': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        'headline-lg': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-hero': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }]
      },
      boxShadow: {
        card: '0 1px 2px rgba(7, 25, 82, 0.06)',
        lift: '0 8px 24px -8px rgba(7, 25, 82, 0.18)',
        'lift-md': '0 16px 40px -12px rgba(7, 25, 82, 0.22)'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-468px 0' },
          '100%': { backgroundPosition: '468px 0' }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        shimmer: 'shimmer 1.4s linear infinite'
      }
    }
  },
  plugins: []
}
