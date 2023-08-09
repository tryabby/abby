import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  const plausibleDomain = process.env["PLAUSIBLE_DOMAIN"];

  return (
    <Html>
      <Head>
        <link
          rel="preload"
          href="/Mona-Sans.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/favicon.png" />
        {plausibleDomain && (
          <script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
          ></script>
        )}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
