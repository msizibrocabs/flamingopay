// Vercel auto-deploy verified
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Allow accessing the dev server from the local network (e.g. your phone)
  allowedDevOrigins: ["172.16.72.161", "localhost"],
  // NOTE: Previously rewrote /api/* → http://localhost:3000 (Express backend).
  // Removed so Next.js App Router handlers in /app/api/* work end-to-end on Vercel.
  // If the Express payment backend comes back, mount it under /ozow/* or a subdomain.
};

export default withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps in production builds
  silent: !process.env.CI,
  // Disable source map upload if no auth token (dev/CI without Sentry)
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Tree-shake Sentry logger in production
  disableLogger: true,
  // Automatically instrument API routes and server components
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
});
