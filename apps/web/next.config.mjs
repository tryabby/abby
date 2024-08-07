import { remarkCodeHike } from "@code-hike/mdx";
// @ts-check
import bundleAnalzyer from "@next/bundle-analyzer";
import mdx from "@next/mdx";
import { withPlausibleProxy } from "next-plausible";
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

export default withPlausibleProxy()(
  withBundleAnalyzer(
    // @ts-ignore
    withMDX(config)
  )
);
