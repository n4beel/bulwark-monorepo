import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", "media"],
  theme: {
    extend: {
      colors: {
        "blue-primary": "var(--blue-primary)",
        "blue-secondary": "var(--blue-secondary)",
        "blue-light": "var(--blue-light)",
        "blue-hover": "var(--blue-hover)",
        "blue-dark": "var(--blue-dark)",
        "gray-dark": "var(--gray-dark)",
        "gray-medium": "var(--gray-medium)",
        "gray-light": "var(--gray-light)",
        "green-light": "var(--green-light)",
        "green-medium": "var(--green-medium)",
        "green-dark": "var(--green-dark)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-inverse": "var(--text-inverse)",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};

export default config;
