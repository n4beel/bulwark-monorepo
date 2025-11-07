import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/shared/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    screens: {
      xs: "320px",
      sm: "400px",
      md: "600px",
      lg: "720px",
      xl: "768px",
      "2xl": "992px",
      "3xl": "1200px",
      "4xl": "1400px",
      "5xl": "1600px",
      "6xl": "1800px",
    },

    extend: {
      colors: {
        bg: "var(--background)",
        fg: "var(--foreground)",
        primary: "var(--blue-primary)",
        "primary-hover": "var(--blue-hover)",
        text: "var(--text-primary)",
        "text-2": "var(--text-secondary)",
        border: "var(--border-color)",
      },
      fontFamily: {
        sans: "var(--font-geist-sans)",
        mono: "var(--font-geist-mono)",
      },
    },
  },

  plugins: [],
};

export default config;
