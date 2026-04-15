// Vercel auto-deploy verified
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow accessing the dev server from the local network (e.g. your phone)
  allowedDevOrigins: ["172.16.72.161", "localhost"],
  // NOTE: Previously rewrote /api/* → http://localhost:3000 (Express backend).
  // Removed so Next.js App Router handlers in /app/api/* work end-to-end on Vercel.
  // If the Express payment backend comes back, mount it under /ozow/* or a subdomain.
};

export default nextConfig;
