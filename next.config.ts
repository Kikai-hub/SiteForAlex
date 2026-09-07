import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// No nonces: nonce-based CSP forces every page to render dynamically (no
// static/ISR), which this mostly-static menu site relies on for performance.
// 'unsafe-inline' is kept for script/style because Next's hydration payload
// and a couple of inline `style` attributes rely on it; every other
// directive is locked down.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Shared across PM2 cluster workers via Redis instead of Next's default
  // per-process cache — see cache-handler.js for why that matters here.
  cacheHandler: require.resolve("./cache-handler.js"),
  cacheMaxMemorySize: 0,
  images: {
    // Without this, next/image's optimized-image cache is per-PM2-worker and
    // in-memory (same problem cache-handler.js exists to solve for page/data
    // caching, just not extended to images by default) — one worker caching a
    // bad result for a URL (e.g. hit right as a file was mid-write) keeps
    // serving that failure for up to `minimumCacheTTL` until it's restarted.
    // Routing images through the same Redis-backed handler shares one
    // consistent cache across every worker instead.
    customCacheHandler: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
