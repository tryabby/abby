import type { PostMeta } from "pages/blog";
import { MarketingLayout, MarketingLayoutProps } from "./MarketingLayout";
import dayjs from "dayjs";
import Image from "next/image";
import { SignupButton } from "./SignupButton";

type Props = Pick<MarketingLayoutProps, "children" | "seoTitle"> & {
  meta: PostMeta;
};

export function BlogLayout({ children, seoTitle, meta }: Props) {
  return (
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
        <section className="prose mx-auto w-full max-w-full lg:prose-lg">
          {children}
        </section>

        <div className="mx-auto mt-12 w-full rounded-lg bg-white p-4 text-center text-lg font-semibold leading-loose shadow-lg">
          A/BBY is an Open Source SaaS for developers to streamline A/B testing
          and feature flagging.
          <br />
          Make data-driven decisions and improve user experience with ease.
          <br />
          Made for developers, by developers.
          <SignupButton className="mt-2 px-3 py-3 text-lg" />
        </div>
      </main>
    </MarketingLayout>
  );
}
