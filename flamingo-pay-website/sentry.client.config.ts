import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance monitoring — sample 10% of transactions
  tracesSampleRate: 0.1,

  // Session replay for debugging user issues — sample 1%
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  // Filter sensitive data
  beforeSend(event) {
    // Strip PII from error reports
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      if (data.pin) data.pin = "[REDACTED]";
      if (data.phone) data.phone = "[REDACTED]";
      if (data.accountNumber) data.accountNumber = "[REDACTED]";
    }
    return event;
  },

  // Ignore common non-actionable errors
  ignoreErrors: [
    "ResizeObserver loop",
    "Non-Error promise rejection",
    "Load failed",
    "Failed to fetch",
  ],
});
