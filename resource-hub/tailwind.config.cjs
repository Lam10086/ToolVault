module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'oklch(56% 0.18 164)', // teal-emerald like
          light: 'oklch(70% 0.14 164)',
          dark: 'oklch(40% 0.20 164)'
        },
        background: 'oklch(96% 0.02 120)',
        surface: 'oklch(98% 0.01 120)'
      },
      borderRadius: {
        DEFAULT: '0.75rem'
      },
      boxShadow: {
        card: '0 4px 12px rgba(0,0,0,0.08)'
      }
    }
  },
  plugins: []
};
