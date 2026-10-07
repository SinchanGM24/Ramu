import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { brand: { 50: "#eefbf6", 100: "#d5f5e7", 500: "#238a62", 600: "#176f4e", 700: "#125a40" } },
      boxShadow: { soft: "0 12px 30px rgba(22, 66, 51, 0.08)" },
    },
  },
  plugins: [],
};
export default config;
