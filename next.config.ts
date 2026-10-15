import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const config: NextConfig = {
  output: "export",
  // Keep full build type-checking on the TypeScript6 compiler API.
  experimental: { useTypeScriptCli: false },
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default function nextConfig(phase: string): NextConfig {
  return {
    ...config,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
