const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.jsx",
  defaultShowCopyCode: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // use this to add <html lang="en"> to all pages
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
};

module.exports = withNextra(nextConfig);
