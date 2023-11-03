import { type AppType } from "next/app";
import { type Session } from "next-auth";
import PlausibleProvider from "next-plausible";
const MyApp: AppType<{ session: Session | null }> = ({ Component, pageProps }) => {
  return (
    <PlausibleProvider domain="docs.tryabby.com">
      <Component {...pageProps} />
    </PlausibleProvider>
  );
};

export default MyApp;
