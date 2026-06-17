import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0A2342",
        ink: "#102033",
        gold: "#C99A2E",
        sand: "#F7F4EE"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(10, 35, 66, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
