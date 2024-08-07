import { DOCS_URL } from "@tryabby/core";
import { INTEGRATIONS } from "components/Integrations";
import { MarketingLayout } from "components/MarketingLayout";
import { SignupButton } from "components/SignupButton";
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import { NextSeo } from "next-seo";
import Link from "next/link";
import type { NextPageWithLayout } from "pages/_app";

const IntegrationPage: NextPageWithLayout<
  InferGetStaticPropsType<typeof getStaticProps>
> = (props) => {
  const integration = INTEGRATIONS.find(
    (i) => i.docsUrlSlug === props.integrationSlug
  );

  if (!integration) {
    return null;
  }

  return (
    <>
      <NextSeo
        title={`Abby ${integration.name} SDK | Abby`}
        description={`Feature Flags, Remote Config & A/B Testing for ${integration.name}. Fully typed & Open Source`}
      />
      <section className="w-full py-12">
        <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6 lg:gap-10">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Abby {integration.name} SDK
            </h2>
            <p className="mx-auto max-w-[700px] text-zinc-500 dark:text-zinc-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Statically typed Feature Flags, Remote Config & A/B testing for{" "}
              <span style={{ color: integration.logoFill }}>
                {integration.name}
              </span>
            </p>
          </div>
          <div className="mt-8 grid w-full grid-cols-1 gap-24 md:grid-cols-[1fr,auto]">
            <div className="flex flex-col items-center space-y-4">
              <div className="text-5xl" style={{ color: integration.logoFill }}>
                {integration.logo}
              </div>
              <h3 className="text-lg font-bold">SDK Features</h3>
              <ul className="list-disc text-left text-sm text-zinc-500 dark:text-zinc-400">
                <li>Feature Flags</li>
                <li>Remote Config</li>
                <li>A/B Testing</li>
                <li>Full Typescript Support</li>
                <li>
                  Fully typed <b>without</b> a build step
                </li>
                <li>Devtools for managing flags, configs, and experiments</li>
                {integration.additionalFeatures?.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col space-y-4">
              <h3 className="text-lg font-bold">Installation</h3>
              <code className="rounded bg-gray-100 p-2 text-sm dark:bg-gray-800">
                npm install{" "}
                <span className="text-primary">
                  @tryabby/{integration.npmPackage}
                </span>
              </code>
              <div className="flex justify-center space-x-4">
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-8 text-sm font-medium text-zinc-50 shadow transition-colors hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 dark:focus-visible:ring-zinc-300"
                  href={`${DOCS_URL}integrations/${integration.docsUrlSlug}`}
                >
                  SDK Docs
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-10">
            <h3 className="mb-4 text-xl font-bold">About Abby</h3>
            <p className="mx-auto max-w-[700px] text-zinc-500 dark:text-zinc-400 lg:text-base/relaxed ">
              Abby is an open-source Feature Flagging, Remote Config, and A/B
              Testing service. Abby&apos; {integration.name} SDK is fully typed
              and open source.
              <br />
              Abby is the easiest way to manage your features and experiments
              for Developers and Product Managers. Start now with our forever
              free plan.
            </p>
          </div>
          <SignupButton />
        </div>
      </section>
    </>
  );
};

IntegrationPage.getLayout = (page) => {
  return <MarketingLayout>{page}</MarketingLayout>;
};

export default IntegrationPage;

export const getStaticProps = ((ctx) => {
  const integrationSlug = ctx.params?.integration;

  if (typeof integrationSlug !== "string") {
    return {
      notFound: true,
    };
  }
  return {
    props: {
      integrationSlug,
    },
  };
}) satisfies GetStaticProps;

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: INTEGRATIONS.map((i) => ({
      params: {
        integration: i.docsUrlSlug,
      },
    })),
    fallback: false,
  };
};
