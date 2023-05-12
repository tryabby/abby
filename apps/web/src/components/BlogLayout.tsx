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

        <div className="mx-auto mt-8 max-w-2xl rounded-lg bg-white p-4 text-lg font-semibold shadow-lg">
          A/BBY is a SaaS tool for developers to streamline A/B testing and
          feature flagging. Make data-driven decisions and improve user
          experience with ease.
          <SignupButton className="mt-2" />
        </div>
      </main>
    </MarketingLayout>
  );
}
