// Vercel auto-deploy verified
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow accessing the dev server from the local network (e.g. your phone)
  allowedDevOrigins: ["172.16.72.161", "localhost"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
