import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Don't advertise the framework via an x-powered-by response header.
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
