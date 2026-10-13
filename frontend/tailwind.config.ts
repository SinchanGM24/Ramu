import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				brand: {
					50: "#eef8f2",
					100: "#d7eedf",
					200: "#b5dec4",
					300: "#8bc7a1",
					400: "#62a97a",
					500: "#448d62",
					600: "#337a51",
					700: "#2c704d",
					800: "#256243",
					900: "#1e553a",
					950: "#17452f",
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
