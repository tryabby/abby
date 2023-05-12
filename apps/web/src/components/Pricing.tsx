import clsx from "clsx";
import { Info } from "lucide-react";
import { signIn } from "next-auth/react";
import { AiOutlineCheckCircle } from "react-icons/ai";
import { getLimitByPlan } from "server/common/plans";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import { cn } from "lib/utils";

type PricingElementProps = {
  price: string;
  title: string;
  subtitle: string;
  features: string[];
  isFeatured?: boolean;
  priceSuffix?: string;
  ctaText?: string;
  onClick: () => void;
  isFull?: boolean;
};

function PricingElement({
  features,
  price,
  subtitle,
  title,
  isFeatured,
  priceSuffix,
  ctaText,
  onClick,
  isFull,
}: PricingElementProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-900 px-4 py-16 lg:border-none",
        isFeatured && "bg-pink-100",
        isFull && "lg:col-span-3 lg:grid lg:grid-cols-3 lg:border-solid lg:py-8"
      )}
    >
      <div>
        <p className="text-4xl font-extrabold">
          {price} <span className="text-sm font-normal">{priceSuffix}</span>
        </p>
        <h2 className={cn("my-6 text-xl font-semibold", isFull && "lg:my-3")}>
          {title}
        </h2>
        <p className={cn("h-32 text-gray-700", isFull && "lg:h-auto")}>
          {subtitle}
        </p>
      </div>
      <div
        className={cn(
          "flex flex-col",
          isFull &&
            "lg:col-span-2 lg:ml-8 lg:grid lg:grid-cols-2 lg:items-center"
        )}
      >
        <button
          onClick={onClick}
          className={cn(
            "my-6 w-full rounded-xl border px-4 py-2 transition-colors duration-200 ease-in-out",
            isFeatured || isFull
              ? "border-pink-300 bg-pink-300 font-medium hover:border-pink-500/70 hover:bg-pink-500/70"
              : "border-gray-900 hover:bg-pink-100/40",
            isFull && "lg:order-2 lg:w-64 lg:justify-self-center"
          )}
        >
          {ctaText ?? `Choose ${title}`}
        </button>
        <ul className="space-y-2 lg:order-1">
          {features.map((feature, i) => {
            return (
              <li key={feature} className="flex items-center space-x-2">
                <AiOutlineCheckCircle className={clsx("text-xl")} />
                <span
                  className={clsx(
                    "flex items-center",
                    i === 0 ? "font-semibold" : "text-gray-700"
                  )}
                >
                  {feature}
                  {i === 0 && (
                    <Tooltip>
                      <TooltipTrigger>
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
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function PricingTable() {
  const basePlan = getLimitByPlan(null);
  const startupPlan = getLimitByPlan("STARTUP");
  const proPlan = getLimitByPlan("PRO");

  return (
    <div className="mx-auto grid max-w-md grid-cols-1 gap-y-4 md:gap-x-4 md:gap-y-12 lg:max-w-none lg:grid-cols-3">
      <PricingElement
        onClick={() => signIn("github", { callbackUrl: "/projects" })}
        price="Free"
        title="Hobby"
        subtitle="Good for IndieHackers that want to get started with A/B Testing & Feature Flags. No Credit card required"
        features={[
          `${basePlan.eventsPerMonth.toLocaleString()} Events / month`,
          `${basePlan.tests} Test`,
          `${basePlan.flags} Feature Flags`,
          `${basePlan.environments} Environment`,
        ]}
      />
      <PricingElement
        onClick={() => signIn("github", { callbackUrl: "/projects" })}
        price="12€"
        title="Startup"
        subtitle="Optimal for startups & small businesses that want to dive deeper with A/B Testing & Feature Flags"
        features={[
          `${startupPlan.eventsPerMonth.toLocaleString()} Events / month`,
          `${startupPlan.tests} Tests`,
          `${startupPlan.flags} Feature Flags`,
          `${startupPlan.environments} Environments`,
        ]}
        priceSuffix="/mo"
        isFeatured
      />
      <PricingElement
        onClick={() => signIn("github", { callbackUrl: "/projects" })}
        price="89€"
        title="Pro"
        subtitle="Perfect for growing companies that want to scale their A/B Testing & Feature Flags and get more insights"
        features={[
          `${proPlan.eventsPerMonth.toLocaleString()} Events / month`,
          `${proPlan.tests} Tests`,
          `${proPlan.flags} Feature Flags`,
          `${proPlan.environments} Environments`,
        ]}
        priceSuffix="/mo"
      />
      <PricingElement
        onClick={() => signIn("github", { callbackUrl: "/projects" })}
        price="Talk to us!"
        title="Enterprise"
        subtitle="For even the biggest enterprise companies."
        ctaText="Contact us"
        features={[
          "Unlimited Events / month",
          "Unlimited Tests",
          "Unlimited Feature Flags",
          "Unlimited Environments",
        ]}
        isFull
      />
    </div>
  );
}
