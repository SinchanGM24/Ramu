import type { NextConfig } from "next";

const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const distDir = process.env.NODE_ENV === "development" ? ".next-dev" : ".next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	distDir,
	basePath,
	assetPrefix: basePath || undefined,
	experimental: {
		externalDir: true,
	},
	serverExternalPackages: [
		"@nestjs/common",
		"@nestjs/core",
		"@nestjs/platform-fastify",
		"@fastify/cookie",
		"@fastify/cors",
		"@fastify/multipart",
		"argon2",
		"pdfkit",
		"pg",
		"redis",
		"sharp",
	],
	trailingSlash: demoMode,
	output: demoMode ? "export" : undefined,
	images: demoMode ? { unoptimized: true } : undefined,
};

export default nextConfig;
