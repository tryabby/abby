import { MarketingLayout } from "components/MarketingLayout";
import { NextPageWithLayout } from "../_app";
import { GetStaticProps } from "next";
import fs from "node:fs/promises";
import path from "node:path";
import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";

export type PostMeta = {
  title: string;
  imageUrl: string;
  publishedAt: string;
  slug: string;
};

type Props = {
  posts: PostMeta[];
};

const BlogPage: NextPageWithLayout<Props> = ({ posts }) => {
  return (
    <div className="container px-6 pb-8 md:px-16">
      <h1 className="mb-4 text-5xl font-bold">Abby Blog</h1>
      <h2 className="mb-4 text-xl text-gray-500">
        Stay up to date with the latest news and updates
      </h2>
      <section className="grid grid-cols-1 gap-8 gap-x-12 md:grid-cols-2">
        {posts.map((p) => (
          <Link href={`/tips-and-insights/${p.slug}`}>
            <div className="relative aspect-video w-full">
              <Image
                src={p.imageUrl}
                alt={p.title}
                className="rounded-md object-cover"
                fill
              />
            </div>
            <span className="my-2 block text-gray-600">
              {dayjs(p.publishedAt).format("MMMM, DD, YYYY")}
            </span>
            <h3 className="text-2xl font-semibold">{p.title}</h3>
          </Link>
        ))}
      </section>
    </div>
  );
};

BlogPage.getLayout = (page) => {
  return <MarketingLayout>{page}</MarketingLayout>;
};

export const getStaticProps: GetStaticProps = async () => {
  const files = await fs.readdir(
    path.resolve(process.cwd(), "src", "pages", "tips-and-insights")
  );

  const posts: Array<PostMeta> = await Promise.all(
    files
      .filter((file) => file.endsWith(".mdx"))
      .map(async (post) => {
        const meta = await import(`./${post}`).then((mod) => mod.meta);
        return {
          ...meta,
          slug: post.replace(".mdx", ""),
        };
      })
  );

  return {
    props: {
      posts: posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    },
  };
};

export default BlogPage;
