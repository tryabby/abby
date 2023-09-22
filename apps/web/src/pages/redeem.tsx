import { MarketingLayout } from "components/MarketingLayout";
import { NextPageWithLayout } from "./_app";
import Link from "next/link";

const RedemptionPage: NextPageWithLayout = () => {
  return (
    <main className="container px-6 py-6 md:px-16">
      <div className="prose mt-12 max-w-full text-center lg:prose-lg prose-h1:font-bold prose-p:font-medium">
        <h1>Hey there 👋</h1>
        <h2>You are awesome 🥳</h2>
        <p>
          Thank you very much for believing in Abby and buying a Lifetime
          License. In order to redeem your license, you need to create an
          account first.
        </p>
        <p>
          You can do this for free{" "}
          <Link href="/login?callbackUrl=/redeem">here</Link>
        </p>
        <p>
          After you signed up, you can then enter redeem your code at the bottom
          of the Settings page.
        </p>
        <p>
          Important: If you already have a subscription, make sure to cancel it
          first as it will be overridden.
        </p>
      </div>
    </main>
  );
};

RedemptionPage.getLayout = (page) => (
  <MarketingLayout seoTitle="Devtools">{page}</MarketingLayout>
);

export default RedemptionPage;
