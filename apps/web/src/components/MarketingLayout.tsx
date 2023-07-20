import clsx from "clsx";
import { NextSeo } from "next-seo";
import { PropsWithChildren } from "react";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { cn } from "lib/utils";

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
  return (
    <>
      <NextSeo title={seoTitle} />
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
