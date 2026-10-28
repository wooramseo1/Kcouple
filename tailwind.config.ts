import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#fff1f3", 100: "#ffe0e6", 400: "#ff6b86", 500: "#fd4a6c", 600: "#e8304f", 700: "#c21f3d" },
        ink: { 900: "#16131a", 700: "#3d3744", 500: "#6f6878", 300: "#b9b3c0", 100: "#efedf2" },
      },
      boxShadow: { card: "0 12px 40px -12px rgba(22,19,26,.35)" },
      keyframes: {
        pop: { "0%": { transform: "scale(.6)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
      },
      animation: { pop: "pop .35s cubic-bezier(.2,1.4,.4,1) both" },
    },
  },
  plugins: [],
} satisfies Config;
