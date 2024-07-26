// @ts-check
import bundleAnalzyer from "@next/bundle-analyzer";
import { withPlausibleProxy } from "next-plausible";
import mdx from "@next/mdx";
import { remarkCodeHike } from "@code-hike/mdx";
import theme from "shiki/themes/poimandres.json" assert { type: "json" };

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
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
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

export default withPlausibleProxy()(
  withBundleAnalyzer(
    // @ts-ignore
    withMDX(config)
  )
);
