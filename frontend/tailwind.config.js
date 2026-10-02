/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F9F6F0',
        panel: '#F1EDE4',
        ink: '#1C1B1A',
        muted: '#6A6763',
        forest: {
          DEFAULT: '#2A4736',
          hover: '#1E3427',
          light: '#3C644E',
        },
        edge: '#DFD9CF',
        paper: '#FAF8F5',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Newsreader', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        DEFAULT: '2px',
        sm: '2px',
        md: '2px',
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
        full: '9999px',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(28, 27, 26, 0.04)',
        paper: '0 1px 3px rgba(28, 27, 26, 0.06)',
      },
    },
  },
  plugins: [],
}
