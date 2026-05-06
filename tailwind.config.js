/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#0f1416',
          background: '#101213',
          secondary: '#171A1C',
          elevated: '#252525',
          menu: '#1E2225',
          accent: '#1d2538',
          'accent-hover': '#324465',
        },
        border: {
          subtle: '#232628',
          header: '#1b1d1e',
          input: '#3A3F45',
          accent: '#39425a',
          hover: '#2A2F33',
          sidebar: '#565758',
        },
        loader: {
          track: '#454545',
          shadow: '#2E2E2E',
        },
        icon: {
          primary: '#d1d5db',
          secondary: '#9ca3af',
          accent: '#39425a',
        },
      },
    },
  },
}

