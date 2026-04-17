import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Only create rate limiter if env vars exist (avoids build errors)
const redis =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
    ? new Redis({
        url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
        token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
      })
    : null;

// General API rate limit: 60 requests per 60 seconds per IP
const apiLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "60 s"), prefix: "rl:api" })
  : null;

// Auth endpoints: 10 attempts per 60 seconds per IP (brute-force protection)
const authLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "60 s"), prefix: "rl:auth" })
  : null;

// Upload: 20 uploads per 60 seconds per IP
const uploadLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "60 s"), prefix: "rl:upload" })
  : null;

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anonymous";
}

const AUTH_PATHS = ["/api/auth/"];
const UPLOAD_PATHS = ["/api/upload"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Non-API routes: add security headers (CSP, HSTS, etc.)
  if (!pathname.startsWith("/api/")) {
    return addSecurityHeaders(NextResponse.next());
  }

  const ip = getIp(req);

  // Pick the right limiter
  const isAuth = AUTH_PATHS.some(p => pathname.startsWith(p));
  const isUpload = UPLOAD_PATHS.some(p => pathname.startsWith(p));
  const limiter = isAuth ? authLimiter : isUpload ? uploadLimiter : apiLimiter;

  if (limiter) {
    const { success, limit, remaining, reset } = await limiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      );
    }
  }

  // Add security headers
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return res;
}

/** CSP + security headers for all page routes. */
function addSecurityHeaders(res: NextResponse): NextResponse {
  // Content Security Policy — strict but functional for Next.js
  const csp = [
    "default-src 'self'",
    // Next.js requires 'unsafe-inline' for styles and 'unsafe-eval' in dev
    `script-src 'self' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""} 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.vercel-storage.com https://*.public.blob.vercel-storage.com",
    "connect-src 'self' https://*.upstash.io https://*.vercel-storage.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].filter(Boolean).join("; ");

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  return res;
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico|icons|manifest).*)"],
};
