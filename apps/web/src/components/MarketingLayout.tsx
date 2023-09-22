import clsx from "clsx";
import { NextSeo } from "next-seo";
import { PropsWithChildren, useEffect, useState } from "react";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { cn } from "lib/utils";
import { useRouter } from "next/router";
import { getSeo } from "seo/SeoDescriptions";
import { ArrowUpCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export type MarketingLayoutProps = PropsWithChildren<{
  isMarkdown?: boolean;
  seoTitle?: string;
}>;

export function MarketingLayout({
  children,
  isMarkdown,
  seoTitle,
}: MarketingLayoutProps) {
  const router = useRouter();
  const pageName = router.asPath;
  const { metaTitle, metaDescription } = getSeo(pageName, "Marketing");
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight / 2) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <NextSeo title={seoTitle ?? metaTitle} description={metaDescription} />
      <main
        className={cn(
          "max-w-screen flex min-h-screen flex-col overflow-x-hidden bg-primary-background text-primary-foreground"
        )}
      >
        <Navbar />
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
        <AnimatePresence>
          {showScrollToTop && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-4 left-4 z-50 hidden rounded-full bg-primary-background p-2 text-accent-background md:block"
              title="Scroll to top"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <ArrowUpCircle className="h-8 w-8" />
            </motion.button>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
