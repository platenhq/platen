import { withSentryConfig } from "@sentry/nextjs/config";
import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

// Bundle size reports after a production build; run with `npm run analyze`
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  // Reports are written to .next/analyze/ instead of opening browser tabs
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [{ protocol: "https", hostname: "img.clerk.com" }],
  },
  experimental: {
    reactCompiler: true,
    serverActions: {
      // Document snapshots carry the full editor state, including pasted images stored inline
      bodySizeLimit: "5mb",
    },
  },
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "trayshmhirk",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Tree-shake logger and configure Vercel monitors in Webpack options
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: true,
  },
});
