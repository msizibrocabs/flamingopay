import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: process.env.NODE_ENV === "production",

  // Performance monitoring
  tracesSampleRate: 0.1,

  // Filter sensitive data from server-side errors
  beforeSend(event) {
    // Strip PII
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      if (data.pin) data.pin = "[REDACTED]";
      if (data.phone) data.phone = "[REDACTED]";
      if (data.accountNumber) data.accountNumber = "[REDACTED]";
      if (data.newPin) data.newPin = "[REDACTED]";
    }
    return event;
  },
});
