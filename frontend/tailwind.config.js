/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      },
      colors: {
        ink: "#0a0f1f",
        panel: "rgba(16, 24, 40, 0.72)",
        line: "rgba(255,255,255,0.12)"
      },
      boxShadow: {
        glow: "0 24px 80px rgba(28, 100, 242, 0.22)",
        soft: "0 18px 50px rgba(0, 0, 0, 0.28)"
      }
    }
  },
  plugins: []
};
