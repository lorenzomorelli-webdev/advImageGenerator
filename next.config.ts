import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = (config.externals ?? []) as (string | RegExp | ((context: any, request: any, callback: any) => void))[];
      externals.push("@resvg/resvg-js");
      config.externals = externals;
    }
    return config;
  },
};

export default nextConfig;
