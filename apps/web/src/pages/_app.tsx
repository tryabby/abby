import { AppProps, type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { trpc } from "../utils/trpc";
import { ThemeProvider } from "next-themes";
import { DefaultSeo } from "next-seo";
import Script from "next/script";
import { env } from "env/client.mjs";
import { ReactElement, ReactNode } from "react";
import { NextPage } from "next";
import { AbbyProvider, withAbby, AbbyDevtools } from "lib/abby";
import { useRouter } from "next/router";
import { TooltipProvider } from "components/Tooltip";

import "../styles/globals.css";
import "@code-hike/mdx/dist/index.css";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const seoDescription = `Discover the benefits of using A/BBY, the open-source feature management and A/B testing SaaS. Increase transparency, collaboration, and trust. Try it now!`;

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, __ABBY_PROJECT_DATA__, ...pageProps },
}: AppPropsWithLayout) => {
  const router = useRouter();

  const currentPageUrl = `https://www.tryabby.com${router.asPath}`;
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);
  return (
    <>
      <AbbyProvider initialData={__ABBY_PROJECT_DATA__}>
        {/* we render different devtools on the landing page */}
        {router.asPath !== "/" && <AbbyDevtools />}
        <ThemeProvider attribute="class" defaultTheme="dark">
          <TooltipProvider>
            <SessionProvider session={session}>
              <main className={`font-sans`}>
                <DefaultSeo
                  defaultTitle="A/BBY - Open Source A/B Testing & Feature Flags"
                  titleTemplate="%s | A/BBY"
                  description={seoDescription}
                  canonical={currentPageUrl}
                  openGraph={{
                    url: currentPageUrl,
                    title: "A/BBY",
                    type: "website",
                    description: seoDescription,
                    images: [
                      {
                        url: "https://www.tryabby.com/og.png",
                        width: 1200,
                        height: 630,
                        alt: "A/BBY",
                        type: "image/png",
                      },
                    ],
                    siteName: "A/BBY",
                  }}
                />
                <Toaster />
                {getLayout(<Component {...pageProps} />)}
              </main>
            </SessionProvider>
          </TooltipProvider>
        </ThemeProvider>
      </AbbyProvider>
    </>
  );
};

export default trpc.withTRPC(withAbby(MyApp));
