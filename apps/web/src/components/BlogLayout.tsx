import type { PostMeta } from "pages/tips-and-insights";
import { MarketingLayout, MarketingLayoutProps } from "./MarketingLayout";
import dayjs from "dayjs";
import Image from "next/image";
import { SignupButton } from "./SignupButton";
import { Divider } from "./Divider";
import { NextSeo } from "next-seo";

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
      <MarketingLayout seoTitle={seoTitle}>
        <main className="container px-6 pb-8 md:px-16">
          <p className="text-md mb-2 text-gray-500">
            Published on {dayjs(meta.publishedAt).format("MMMM DD, YYYY")}
          </p>
          <h1 className="text-5xl font-bold">{meta.title}</h1>
          <div className="relative my-6 aspect-video max-h-[500px] w-full">
            <Image
              src={meta.imageUrl}
              alt={meta.title}
              className="rounded-md object-contain"
              fill
            />
          </div>
          <section className="prose mx-auto w-full max-w-full dark:prose-invert lg:prose-lg">
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
