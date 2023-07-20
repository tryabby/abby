import clsx from "clsx";
import { NextSeo } from "next-seo";
import { PropsWithChildren } from "react";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { cn } from "lib/utils";
import { useRouter } from "next/router";
import { getSeo } from "seo/SeoDescriptions";

export type MarketingLayoutProps = PropsWithChildren<{
  isMarkdown?: boolean;
  seoTitle?: string;
  isInverted?: boolean;
}>;

export function MarketingLayout({
  children,
  isMarkdown,
  seoTitle,
  isInverted,
}: MarketingLayoutProps) {
  console.log("seoTitle", seoTitle);
  const router = useRouter();
  const pageName = router.asPath;
  console.log("Path:", pageName);
  const { metaTitle, metaDescription } = getSeo(pageName, "Marketing");
  return (
    <>
      <NextSeo title={metaTitle} description={metaDescription} />
      <main
        className={cn(
          "max-w-screen flex min-h-screen flex-col overflow-x-hidden bg-primary-background text-primary-foreground"
        )}
      >
        <Navbar isInverted={isInverted} />
        <section
          className={clsx(
            "flex-1 pt-6",
            isMarkdown && "container w-full px-6 py-6 md:px-16"
          )}
        >
          {isMarkdown ? (
            <div className="prose max-w-full dark:prose-invert lg:prose-lg">
              {children}
            </div>
          ) : (
            children
          )}
        </section>
        <Footer />
      </main>
    </>
  );
}
