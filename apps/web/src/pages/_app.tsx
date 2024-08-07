import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { DefaultSeo } from "next-seo";
import { ThemeProvider } from "next-themes";
import type { AppProps, AppType } from "next/app";
import { Toaster } from "react-hot-toast";
import { trpc } from "../utils/trpc";

import { TooltipProvider } from "components/Tooltip";
import { env } from "env/client.mjs";
import { AbbyDevtools, AbbyProvider, withAbby } from "lib/abby";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import type { ReactElement, ReactNode } from "react";
import "@fontsource/martian-mono/600.css";

import "../styles/shadcn.css";
import "@code-hike/mdx/dist/index.css";
import PlausibleProvider from "next-plausible";

export type NextPageWithLayout<P = unknown, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const seoDescription =
  "Discover the benefits of using Abby, the open-source feature management and A/B testing SaaS. Increase transparency, collaboration, and trust. Try it now!";

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
              <PlausibleProvider
                domain={env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? ""}
              >
                <main className={"font-sans"}>
                  <DefaultSeo
                    defaultTitle="Abby - Open Source A/B Testing & Feature Flags"
                    titleTemplate="%s"
                    description={seoDescription}
                    canonical={currentPageUrl}
                    openGraph={{
                      url: currentPageUrl,
                      title: "Abby",
                      type: "website",
                      description: seoDescription,
                      images: [
                        {
                          url: `${
                            process.env.VERCEL_URL
                              ? `https://${process.env.VERCEL_URL}`
                              : "https://www.tryabby.com"
                          }/og.png`,
                          width: 1200,
                          height: 630,
                          alt: "Abby",
                          type: "image/png",
                        },
                      ],
                      siteName: "Abby",
                    }}
                  />
                  <Toaster />
                  {getLayout(<Component {...pageProps} />)}
                </main>
              </PlausibleProvider>
            </SessionProvider>
          </TooltipProvider>
        </ThemeProvider>
      </AbbyProvider>
    </>
  );
};

export default trpc.withTRPC(withAbby(MyApp));
