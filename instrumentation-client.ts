// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  // Development errors (often local network blips) never reach production alerts
  enabled: isProduction,
  dsn: "https://4d6d7b1a01fd012f688f8a51ff6dc0b4@o4508349405134848.ingest.de.sentry.io/4508349413195856",

  // Replay is loaded lazily below, keeping it out of the initial bundle
  integrations: [],

  // Sample traces only in production to eliminate dev instrumentation overhead
  tracesSampleRate: isProduction ? 0.1 : 0,

  // Replays session sampling
  replaysSessionSampleRate: 0,

  // Sample replays only on error in production
  replaysOnErrorSampleRate: isProduction ? 1.0 : 0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

/**
 * Session Replay is about 180 kB, so it is fetched from Sentry's CDN once the page is idle instead
 * of shipping in the bundle. Errors are reported either way; only an error in the first moments
 * after load, before Replay arrives, goes without a recording. If the CDN cannot be reached,
 * error reporting carries on without Replay.
 */
if (isProduction && typeof window !== "undefined") {
  const loadReplay = () => {
    Sentry.lazyLoadIntegration("replayIntegration")
      .then((replayIntegration) => Sentry.addIntegration(replayIntegration()))
      .catch(() => {
        // Replay is optional; errors are still captured without it
      });
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadReplay, { timeout: 5000 });
  } else {
    setTimeout(loadReplay, 2000);
  }
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
