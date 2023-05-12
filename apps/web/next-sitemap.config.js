/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://tryabby.com",
  generateRobotsTxt: true, // (optional)
  exclude: [
    "/test",
    "/checkout",
    "/projects",
    "/invites",
    "/marketing/*",
    "/redeem",
  ],
  // ...other options
};
