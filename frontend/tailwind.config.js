/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "var(--color-ink)",
        panel: "var(--color-panel)",
        line: "var(--color-line)",
        white: "var(--color-white)",
        slate: {
          950: "var(--color-slate-950)",
          900: "var(--color-slate-900)",
          800: "var(--color-slate-800)",
          300: "var(--color-slate-300)",
          400: "var(--color-slate-400)",
          500: "var(--color-slate-500)",
          800: "var(--color-slate-800)"
        }
      },
      boxShadow: {
        glow: "0 24px 80px rgba(28, 100, 242, 0.22)",
        soft: "0 18px 50px rgba(0, 0, 0, 0.28)"
      }
    }
  },
  plugins: []
};
