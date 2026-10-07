import type { NextConfig } from "next";

const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: demoMode,
  output: demoMode ? "export" : undefined,
  images: demoMode ? { unoptimized: true } : undefined,
};

export default nextConfig;
