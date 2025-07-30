/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Tablet-optimized breakpoints
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',   // Standard tablet portrait
        'lg': '1024px',  // Large tablet landscape
        'xl': '1280px',
        '2xl': '1536px',
      },
      // Touch-target sizing utilities
      minWidth: {
        'touch-44': '44px',  // WCAG minimum
        'touch-48': '48px',  // Material Design recommendation
        'touch-56': '56px',  // Large touch targets
      },
      minHeight: {
        'touch-44': '44px',
        'touch-48': '48px',
        'touch-56': '56px',
      },
      // Spacing for touch targets
      spacing: {
        'touch-gap': '8px',  // Minimum spacing between touch targets
        'touch-safe': '16px', // Safe spacing for important controls
      },
      // Glassmorphism utilities
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      backgroundColor: {
        'glass': 'rgba(255, 255, 255, 0.1)',
        'glass-dark': 'rgba(0, 0, 0, 0.1)',
      },
      borderColor: {
        'glass': 'rgba(255, 255, 255, 0.2)',
      },
      // Animation for touch feedback
      animation: {
        'pulse-fast': 'pulse 1s ease-in-out infinite',
        'bounce-soft': 'bounce 1s ease-in-out infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      // Box shadows for neumorphism
      boxShadow: {
        'neu-inset': 'inset 2px 2px 5px rgba(0, 0, 0, 0.1), inset -2px -2px 5px rgba(255, 255, 255, 0.8)',
        'neu-outset': '2px 2px 5px rgba(0, 0, 0, 0.1), -2px -2px 5px rgba(255, 255, 255, 0.8)',
        'neu-pressed': 'inset 1px 1px 3px rgba(0, 0, 0, 0.2), inset -1px -1px 3px rgba(255, 255, 255, 0.7)',
      },
      // Typography optimized for tablets
      fontSize: {
        'touch-sm': ['14px', '20px'],
        'touch-base': ['16px', '24px'],
        'touch-lg': ['18px', '28px'],
        'touch-xl': ['20px', '30px'],
        'touch-2xl': ['24px', '36px'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // Custom plugin for touch utilities
    function({ addUtilities }) {
      const touchUtilities = {
        '.touch-target': {
          'min-width': '44px',
          'min-height': '44px',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        },
        '.touch-target-lg': {
          'min-width': '48px',
          'min-height': '48px',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        },
        '.touch-target-xl': {
          'min-width': '56px',
          'min-height': '56px',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        },
        '.glass-effect': {
          'backdrop-filter': 'blur(8px)',
          'background': 'rgba(255, 255, 255, 0.1)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.press-effect': {
          'transform': 'scale(0.98)',
          'transition': 'transform 0.1s ease-in-out',
        },
      };
      addUtilities(touchUtilities);
    },
  ],
};