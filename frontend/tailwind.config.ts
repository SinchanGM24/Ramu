import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				brand: {
					50: "#edf6ef",
					100: "#d9eadc",
					200: "#b5d6bc",
					300: "#87ba94",
					400: "#5c9870",
					500: "#387953",
					600: "#245f3f",
					700: "#174b31",
					800: "#103923",
					900: "#092b1a",
					950: "#051c11",
				},
			},
			boxShadow: {
				soft: "0 16px 38px rgba(26, 65, 42, 0.08)",
				panel: "0 18px 48px rgba(26, 65, 42, 0.1)",
			},
		},
	},
	plugins: [],
};
export default config;
