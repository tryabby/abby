import clsx from "clsx";
import { NextSeo } from "next-seo";
import { PropsWithChildren } from "react";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { cn } from "lib/utils";
import { useRouter } from "next/router";

export type MarketingLayoutProps = PropsWithChildren<{
  isMarkdown?: boolean;
  seoTitle?: string;
  isInverted?: boolean;
}>;

type SeoProps = {
  metaDescription: string;
  metaTitle: string;
};
function getSeo(pageName: string): SeoProps {
  switch (pageName) {
    case "/":
      return {
        metaTitle: "Open Source A/B Tests, Feature Flags and feature testing  ",
        metaDescription:
          "Looking for a free and easy-to-implement A/B testing tool for developers? Check out our open-source software that includes feature flags and allows for fast and efficient feature testing. Start optimizing your website or application today!",
      };
    case "/login":
      return {
        metaTitle: "A/B Tests, Feature Flags and feature testing   Log in",
        metaDescription:
          "Log in to our free A/B testing tool designed specifically for developers. With open-source software, it offers easy and fast implementation, allowing you to perform feature testings and utilize feature flags. Start optimizing your website or application with our free AB testing tool today.",
      };
    case "/devtools":
      return {
        metaTitle:
          "Learn about the implementation of A/B testing tools, open-source software that is easy and fast to implement. Discover how feature flags can help you with feature testing and explore various developer tools available for A/B testing purposes.",
        metaDescription: "",
      };
    case "/imprint":
      return {
        metaTitle:
          "Imprint: A/B Tests, Feature Flags and feature testings  Legal Information",
        metaDescription:
          "Official imprint of A/BBY, the open-source A/B testing tool. Find our legal information and get in touch. We offer feature flagging and ab testing solutions with clear analytics.",
      };
    case "/blog":
      return {
        metaTitle: "",
        metaDescription:
          "Discover tips and insights about A/B testing tools, open-source software, feature flags, Next.js, and A/B testing in React. Learn how to effectively use these dev tools for feature testing and optimizing your software development process.",
      };
    case "/blog/a-b-react":
      return {
        metaTitle: '"A/B Testing in React using Hooks  Tips & Insights"',
        metaDescription:
          "Learn about implementing A/B testing in React using hooks with A/BBY. Understand the benefits of A/B testing and how to use the use A/BBY hook for improved user experience and data-driven decision-making.",
      };
    case "/contact":
      return {
        metaTitle: "Answers to questions regarding A/B tests  Contact",
        metaDescription:
          "Contact A/BBY, an open-source A/B testing tool, for all your questions and needs related to A/B testing, feature flags, and feature testing. Optimize your software with confidence.",
      };
    default:
      return {
        metaTitle: "Answers to questions regarding A/B tests  Contact",
        metaDescription:
          "Contact A/BBY, an open-source A/B testing tool, for all your questions and needs related to A/B testing, feature flags, and feature testing. Optimize your software with confidence.",
      };
  }
}

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
  const { metaTitle, metaDescription } = getSeo(pageName);
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
