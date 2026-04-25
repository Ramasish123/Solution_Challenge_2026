export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#196344", // Custom dark green from reference
          900: "#14532d",
        },
        accent: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
        },
        surface: "#ffffff",
        muted: "#f4f5f7",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        ink: "#1f2937",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.02)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.04)",
        sidebar: "1px 0 0 0 #e2e8f0",
        modal: "0 20px 60px rgba(0,0,0,0.15)",
      },
      backgroundImage: {
        "page-gradient": "linear-gradient(135deg, #f4f5f7 0%, #f9fafb 100%)",
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
      },
    },
  },
  plugins: [],
};
