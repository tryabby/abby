// @ts-check
import { remarkCodeHike } from "@code-hike/mdx";
import bundleAnalzyer from "@next/bundle-analyzer";
import mdx from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";
import { withPlausibleProxy } from "next-plausible";
import theme from "shiki/themes/poimandres.json" with { type: "json" };

const withMDX = mdx({
  extension: /\.mdx?$/,
  options: {
    // If you use remark-gfm, you'll need to use next.config.mjs
    // as the package is ESM only
    // https://github.com/remarkjs/remark-gfm#install
    remarkPlugins: [
      [remarkCodeHike, { theme, lineNumbers: true, showCopyButton: true }],
    ],
    rehypePlugins: [],
    // If you use `MDXProvider`, uncomment the following line.
    // providerImportSource: "@mdx-js/react",
  },
});

const withBundleAnalyzer = bundleAnalzyer({
  enabled: process.env.ANALYZE === "true",
});

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
!process.env.SKIP_ENV_VALIDATION && (await import("./src/env/server.mjs"));

const cspHeader = `
    frame-ancestors 'none';
`;

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  output: "standalone",
  swcMinify: true,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  transpilePackages: ["lodash-es"],
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  experimental: {
    instrumentationHook: true,
  },
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    if (!isProduction) return [];
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
        ],
      },
    ];
  },
};

console.log({
  "process.env.SENTRY_ORG": process.env.SENTRY_ORG,
  "process.env.SENTRY_PROJECT": process.env.SENTRY_PROJECT,

})

const withSentry =
  process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
    ? withSentryConfig
    : (/** @type {any} */ config) => config;

export default withSentry(
  withPlausibleProxy()(
    withBundleAnalyzer(
      // @ts-ignore
      withMDX(config)
    )
  ),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    sentryUrl: "https://sentry.io/",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  }
);
