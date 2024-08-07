import fs from "node:fs/promises";
import path from "node:path";
import { MarketingLayout } from "components/MarketingLayout";
import dayjs from "dayjs";
import type { GetStaticProps } from "next";
import Image from "next/image";
import Link from "next/link";
import type { NextPageWithLayout } from "../_app";

export type PostMeta = {
  title: string;
  imageUrl: string;
  publishedAt: string;
  slug: string;
  excerpt?: string;
};

type Props = {
  posts: PostMeta[];
};

const BlogPage: NextPageWithLayout<Props> = ({ posts }) => {
  return (
    <div className="container px-6 pb-8 md:px-16">
      <h1 className="mb-4 text-5xl font-bold">Abby Blog</h1>
      <h2 className="mb-4 text-xl text-muted-foreground">
        Stay up to date with the latest news and updates
      </h2>
      <section className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/tips-and-insights/${p.slug}`}
            className="group"
          >
            <div className="relative aspect-video w-full">
              <Image
                src={p.imageUrl}
                alt={p.title}
                className="rounded-md object-cover transition-all duration-300 group-hover:scale-105"
                fill
              />
            </div>
            <span className="mb-2  mt-4 block text-muted-foreground">
              {dayjs(p.publishedAt).format("MMMM, DD, YYYY")}
            </span>
            <h3 className="text-xl font-medium">{p.title}</h3>
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
