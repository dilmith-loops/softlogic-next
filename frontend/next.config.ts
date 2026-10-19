import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/softlogic",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
