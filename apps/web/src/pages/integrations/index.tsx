import { INTEGRATIONS } from "components/Integrations";
import { MarketingLayout } from "components/MarketingLayout";
import { Button } from "components/ui/button";
import Link from "next/link";
import type { NextPageWithLayout } from "../_app";

const IntegrationsMainPage: NextPageWithLayout = () => {
  return (
    <main className="flex-1 py-12 md:py-24 lg:py-32">
      <div className="container px-4 text-center md:px-6">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
          Our Integrations and SDKs
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-zinc-500 dark:text-zinc-400 md:text-xl">
          We provide a wide range of integrations and SDKs to help you get the
          most out of our service.
        </p>
      </div>
      <div className="container mt-24 grid gap-8 px-4 sm:grid-cols-2 md:px-6 lg:grid-cols-3 ">
        {INTEGRATIONS.map((integration) => (
          <div
            key={integration.name}
            className="flex flex-col items-center space-y-4"
          >
            <div className="text-5xl" style={{ color: integration.logoFill }}>
              {integration.logo}
            </div>
            <h2 className="text-xl font-bold">{integration.name}</h2>
            <p className="max-w-[300px] text-center text-zinc-500 dark:text-zinc-400">
              {integration.description}
            </p>
            <Link href={`/integrations/${integration.docsUrlSlug}`}>
              <Button variant="outline">Learn More</Button>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
};

IntegrationsMainPage.getLayout = (page) => {
  return (
    <MarketingLayout seoTitle="Integations & SDKs | Abby">
      {page}
    </MarketingLayout>
  );
};

export default IntegrationsMainPage;
