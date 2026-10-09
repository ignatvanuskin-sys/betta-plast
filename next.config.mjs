/**
 * Next.js configuration.
 *
 * Notes:
 * - `@electric-sql/pglite` ships a WASM Postgres; it must stay external so the
 *   bundler does not try to inline the wasm asset.
 * - `pg` is likewise kept external (native-ish driver).
 */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['@electric-sql/pglite', 'pg'],
  /**
   * The SQL migrations are read from disk at runtime by the Drizzle migrator.
   * They are not imported by any module, so the bundler would otherwise drop
   * them from the serverless output and migrations would silently find nothing.
   */
  outputFileTracingIncludes: {
    '/**': ['./drizzle/**'],
  },
  experimental: {
    // Uploaded design files (drawings/specs) are posted through route handlers.
    serverActions: {
      bodySizeLimit: '16mb',
    },
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      // Next.js injects inline bootstrap scripts; analytics scripts are loaded
      // only after cookie consent (see components/CookieConsent.tsx).
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mc.yandex.ru https://www.googletagmanager.com https://connect.facebook.net",
      // Fonts are self-hosted by next/font — no external font origin needed.
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://mc.yandex.ru https://www.google-analytics.com https://region1.google-analytics.com",
      'frame-src https://yandex.ru https://2gis.kz https://www.googletagmanager.com',
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
