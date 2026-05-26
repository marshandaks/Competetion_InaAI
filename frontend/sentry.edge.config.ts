import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://a6b61882df6a23be699d7990ff5d6a89@o4507000000000000.ingest.us.sentry.io/4507000000000000",
  tracesSampleRate: 1.0,
  debug: false,
});
