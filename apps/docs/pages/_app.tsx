import { type AppType } from "next/app";
import PlausibleProvider from "next-plausible";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <PlausibleProvider domain="docs.tryabby.com">
      <Component {...pageProps} />
    </PlausibleProvider>
  );
};

export default MyApp;
