import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
    // If you want to be more specific and only ignore unused imports:
  },
};

export default nextConfig;
