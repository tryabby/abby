import clsx from "clsx";
import { cn } from "lib/utils";
import { Info } from "lucide-react";
import { useSession } from "next-auth/react";

import Link from "next/link";
import { useRouter } from "next/router";
import { AiOutlineCheckCircle } from "react-icons/ai";
import { getLimitByPlan } from "server/common/plans";
import { Plan } from "types/plausible-events";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import { useTracking } from "lib/tracking";
import { Fragment, useState } from "react";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

type PricingElementProps = {
  price: string;
  title: string;
  subtitle: string;
  features: string[];
  isFeatured?: boolean;
  priceSuffix?: string;
  ctaText?: string;
  href: string;
  isFull?: boolean;
  planName: Plan;
};

function PricingElement({
  features,
  price,
  subtitle,
  title,
  priceSuffix,
  ctaText,
  href,
  isFull,
  planName,
}: PricingElementProps) {
  const trackEvent = useTracking();

  return (
    <div
      className={cn(
        "rounded-2xl border border-ab_accent-background px-4 py-16",
        isFull && "lg:col-span-3 lg:grid lg:grid-cols-3 lg:border-solid lg:py-8"
      )}
    >
      <div>
        <p className="text-4xl font-extrabold">
          {price} <span className="text-sm font-normal">{priceSuffix}</span>
        </p>
        <h2
          className={cn("mb-3 mt-6 text-xl font-semibold", isFull && "lg:my-3")}
        >
          {title}
        </h2>
        {/* <p className={cn("te h-32", isFull && "lg:h-auto")}>{subtitle}</p> */}
      </div>
      <div
        className={cn(
          "flex flex-col",
          isFull &&
            "lg:col-span-2 lg:ml-8 lg:grid lg:grid-cols-2 lg:items-center"
        )}
      >
        <Link
          href={href}
          className={cn(
            "my-6 w-full rounded-xl border px-4 py-2 transition-colors duration-200 ease-in-out",
            "border-ab_accent-background hover:bg-ab_accent-background",
            isFull && "lg:order-2 lg:w-64 lg:justify-self-center"
          )}
          onClick={() =>
            trackEvent("Plan Selected", { props: { Plan: planName } })
          }
        >
          {ctaText ?? `Choose ${title}`}
        </Link>
        <ul className="grid grid-cols-[auto,1fr] gap-2">
          {features.map((feature, i) => {
            return (
              <Fragment key={feature}>
                <AiOutlineCheckCircle className={clsx("text-xl")} />
                <span
                  suppressHydrationWarning
                  className={clsx(
                    "flex items-center",
                    i === 0 ? "font-semibold" : "te"
                  )}
                >
                  {feature}
                  {i === 0 && (
                    <Tooltip>
                      <TooltipTrigger aria-label="Show more information">
                        <Info size={14} className="ml-1" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          This number includes the events that are used for A/B
                          testing analytics as well as the amount of requests to
                          our servers.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </span>
              </Fragment>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function PricingTable() {
  const [useEuro, setUseEuro] = useState(false);
  const session = useSession();
  const basePlan = getLimitByPlan(null);
  const startupPlan = getLimitByPlan("STARTUP");
  const proPlan = getLimitByPlan("PRO");

  return (
    <div>
      <div className="my-6 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Label htmlFor="currency">USD ($)</Label>
          <Switch
            id="currency"
            checked={useEuro}
            onCheckedChange={setUseEuro}
          />
          <Label htmlFor="currency">Euro (€)</Label>
        </div>
      </div>
      <div className="mx-auto grid max-w-md grid-cols-1 gap-y-4 md:max-w-3xl md:grid-cols-2 md:gap-x-4 md:gap-y-12 xl:max-w-none xl:grid-cols-4">
        <PricingElement
          href={session.status === "authenticated" ? "/projects" : "/signup"}
          price="Free"
          title="Starter"
          planName="HOBBY"
          subtitle="Good for IndieHackers that want to get started with Feature Flags & Remote Config. No Credit card required"
          features={[
            `${basePlan.eventsPerMonth.toLocaleString()} Events / month`,
            `${basePlan.tests} A/B Test`,
            `${basePlan.flags} Feature Flags / Remote Configs`,
            `${basePlan.environments} Environments`,
          ]}
        />
        <PricingElement
          href={session.status === "authenticated" ? "/projects" : "/signup"}
          price={`${useEuro ? "" : "$"}12${useEuro ? "€" : ""}`}
          title="Startup"
          subtitle="Optimal for startups & small businesses that want to dive deeper with Feature Flags & Remote Config"
          planName="STARTUP"
          features={[
            `${startupPlan.eventsPerMonth.toLocaleString()} Events / month`,
            `${startupPlan.tests} A/B Tests`,
            `${startupPlan.flags} Feature Flags / Remote Configs`,
            `${startupPlan.environments} Environments`,
          ]}
          priceSuffix="/mo per Project"
          isFeatured
        />
        <PricingElement
          href={session.status === "authenticated" ? "/projects" : "/signup"}
          price={`${useEuro ? "" : "$"}89${useEuro ? "€" : ""}`}
          title="Pro"
          planName="PRO"
          subtitle="Perfect for growing companies that want to scale their Feature Flags & Remote Config and get more insights"
          features={[
            `${proPlan.eventsPerMonth.toLocaleString()} Events / month`,
            `${proPlan.tests} A/B Tests`,
            `${proPlan.flags} Feature Flags / Remote Configs`,
            `${proPlan.environments} Environments`,
          ]}
          priceSuffix="/mo per Project"
        />
        <PricingElement
          href={"/contact"}
          price="Talk to us!"
          title="Enterprise"
          planName="ENTERPRISE"
          subtitle="For even the biggest enterprise companies."
          ctaText="Contact us"
          features={[
            "Unlimited Events / month",
            "Unlimited Tests",
            "Unlimited Feature Flags / Remote Configs",
            "Unlimited Environments",
          ]}
        />
      </div>
    </div>
  );
}
