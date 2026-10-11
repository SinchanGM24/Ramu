import type { NextConfig } from "next";

const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const distDir = process.env.NODE_ENV === "development" ? ".next-dev" : ".next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir,
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: demoMode,
  output: demoMode ? "export" : undefined,
  images: demoMode ? { unoptimized: true } : undefined,
};

export default nextConfig;
