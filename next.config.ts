import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/sfreps",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
