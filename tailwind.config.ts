// RUAN MARCELO RAMACIOTI LUZ
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--belin-ink-rgb) / <alpha-value>)",
        paper: "rgb(var(--belin-cream-rgb) / <alpha-value>)",
        accent: "rgb(var(--belin-wine-rgb) / <alpha-value>)",
        wine: "rgb(var(--belin-wine-rgb) / <alpha-value>)",
        "wine-dark": "rgb(var(--belin-wine-dark-rgb) / <alpha-value>)",
        cream: "rgb(var(--belin-cream-rgb) / <alpha-value>)",
        nude: "rgb(var(--belin-nude-rgb) / <alpha-value>)",
        lilac: "rgb(var(--belin-wine-rgb) / <alpha-value>)",
        muted: "var(--belin-muted)",
        success: "var(--belin-success)",
        danger: "var(--belin-danger)",
      },
      borderRadius: {
        "belin-sm": "var(--belin-radius-sm)",
        "belin-md": "var(--belin-radius-md)",
        "belin-lg": "var(--belin-radius-lg)",
      },
      boxShadow: { "belin-soft": "var(--belin-shadow-soft)" },
      fontFamily: { sans: ["var(--font-inter)", "Arial", "sans-serif"], display: ["var(--font-cormorant)", "Georgia", "serif"] },
    },
  },
  plugins: [],
};

export default config;
