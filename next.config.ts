import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/relearn-api/:path*",
        destination: `${process.env.RELEARN_API_PROXY_TARGET || "http://127.0.0.1:8000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
