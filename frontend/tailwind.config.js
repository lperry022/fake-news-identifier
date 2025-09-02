/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Arial"],
      },
      colors: {
        brand: {
          50: "#ecf3ff",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
        },
      },
      boxShadow: {
        glass: "0 8px 24px rgba(2,6,23,.55)",
        soft: "0 6px 20px rgba(2,6,23,.35)",
      },
      borderRadius: {
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
