import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b0d10",
          900: "#0f1216",
          800: "#15191f",
          700: "#1c222a",
          600: "#2a3039",
          300: "#a8b0bb",
          200: "#c9cfd8",
          100: "#e6e9ee"
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
