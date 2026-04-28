import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#fafaf8",
          900: "#f0ebe5",
          800: "#e4dcd4",
          700: "#c8bdb4",
          600: "#9a9088",
          300: "#4e4840",
          200: "#2e2820",
          100: "#18120c"
        },
        accent: {
          DEFAULT: "#c68b5a",
          soft: "#8a6e55"
        },
        alert: {
          DEFAULT: "#c1454b"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        serif: ["Newsreader", "Georgia", "serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
