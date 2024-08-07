import dayjs from "dayjs";
import { NextSeo } from "next-seo";
import Image from "next/image";
import type { PostMeta } from "pages/tips-and-insights";
import { Divider } from "./Divider";
import { MarketingLayout, type MarketingLayoutProps } from "./MarketingLayout";
import { SignupButton } from "./SignupButton";

type Props = Pick<MarketingLayoutProps, "children" | "seoTitle"> & {
  meta: PostMeta;
};

export function BlogLayout({ children, seoTitle, meta }: Props) {
  return (
    <>
      <NextSeo
        openGraph={{
          images: [
            {
              url: `${
                process.env.VERCEL_URL
                  ? `https://${process.env.VERCEL_URL}`
                  : "https://www.tryabby.com"
              }${meta.imageUrl}`,
            },
          ],
        }}
      />
      <MarketingLayout
        seoTitle={seoTitle ?? meta.title}
        seoDescription={meta.excerpt}
      >
        <main className="container px-6 pb-8 md:px-16">
          <p className="text-md mb-4 text-gray-500">
            Published on {dayjs(meta.publishedAt).format("MMMM DD, YYYY")}
          </p>
          <h1 className="text-4xl font-bold">{meta.title}</h1>
          <div className="relative my-12 aspect-video max-h-[400px] w-full">
            <Image
              src={meta.imageUrl}
              alt={meta.title}
              className="rounded-md object-contain"
              fill
            />
          </div>
          <section className="prose mx-auto w-full max-w-4xl dark:prose-invert lg:prose-lg">
            {children}
          </section>
          <Divider className="my-12" />
          <div className="mx-auto w-full rounded-lg p-4 text-center text-lg font-semibold leading-loose">
            Abby is an Open Source SaaS for developers to streamline A/B testing
            and feature flagging.
            <br />
            Make data-driven decisions and improve user experience with ease.
            <br />
            Made for developers, by developers.
            <SignupButton className="mt-2 px-3 py-3 text-lg" />
          </div>
        </main>
      </MarketingLayout>
    </>
  );
}
