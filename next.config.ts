import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include static data files in the deployment bundle
  outputFileTracingIncludes: {
    "/**": ["./public/data/**"],
  },
};

export default nextConfig;
