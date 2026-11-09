// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  // Development errors (often local network blips) never reach production alerts
  enabled: isProduction,
  dsn: "https://4d6d7b1a01fd012f688f8a51ff6dc0b4@o4508349405134848.ingest.de.sentry.io/4508349413195856",

  // Only enable heavy replay integration in production to optimize local dev performance
  integrations: isProduction ? [Sentry.replayIntegration()] : [],

  // Sample traces only in production to eliminate dev instrumentation overhead
  tracesSampleRate: isProduction ? 0.1 : 0,

  // Replays session sampling
  replaysSessionSampleRate: 0,

  // Sample replays only on error in production
  replaysOnErrorSampleRate: isProduction ? 1.0 : 0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
