module.exports = {
  purge: ['./components/**/*.tsx', './pages/**/*.tsx'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            a: {
              textDecoration: 'none',
              fontWeight: '400',
            },
            img: {
              marginTop: 0,
              marginBottom: 0,
            },
          },
        },
        xl: {
          css: {
            img: {
              marginTop: 0,
              marginBottom: 0,
            },
          },
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
};
