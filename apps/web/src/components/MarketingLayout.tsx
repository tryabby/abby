import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "lib/utils";
import { ArrowUpCircle } from "lucide-react";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";
import { type PropsWithChildren, useEffect, useState } from "react";
import { getSeo } from "seo/SeoDescriptions";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export type MarketingLayoutProps = PropsWithChildren<{
  isMarkdown?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}>;

export function MarketingLayout({
  children,
  isMarkdown,
  seoTitle,
  seoDescription,
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
      <NextSeo
        title={seoTitle ?? metaTitle}
        description={seoDescription ?? metaDescription}
      />
      <main
        className={cn(
          "max-w-screen flex min-h-screen flex-col overflow-x-hidden bg-ab_primary-background text-ab_primary-foreground"
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
              className="fixed bottom-4 left-4 z-50 hidden rounded-full bg-ab_primary-background p-2 text-ab_accent-background md:block"
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
