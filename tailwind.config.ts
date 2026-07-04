import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#0a0c14", 900: "#0f1220", 800: "#161a2c", 700: "#1f2438", 600: "#2a3049" },
        pulse: { 400: "#8b8bf5", 500: "#6c6cf0", 600: "#5555e8" },
      },
    },
  },
  plugins: [],
};
export default config;
