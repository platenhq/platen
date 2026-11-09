// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  // Development errors (often local network blips) never reach production alerts
  enabled: isProduction,
  dsn: "https://4d6d7b1a01fd012f688f8a51ff6dc0b4@o4508349405134848.ingest.de.sentry.io/4508349413195856",

  // Sample traces only in production to eliminate dev server overhead
  tracesSampleRate: isProduction ? 0.1 : 0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
