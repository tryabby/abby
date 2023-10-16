import { DOCS_URL, HttpService } from "@tryabby/core";
import DevtoolsFactory from "@tryabby/devtools";
import { createAbby } from "@tryabby/next";
import { BaseCodeSnippet } from "components/CodeSnippet";
import { Divider } from "components/Divider";
import { Feature } from "components/Feature";
import { MarketingLayout } from "components/MarketingLayout";
import { PricingTable } from "components/Pricing";
import { Clock, ExternalLink, FlaskConical, Shield } from "lucide-react";
import { InferGetStaticPropsType } from "next";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { BsBarChartFill, BsCodeSlash } from "react-icons/bs";
import { FaQuestion } from "react-icons/fa";
import { GiPadlock } from "react-icons/gi";
import { twMerge } from "tailwind-merge";
import { generateCodeSnippets } from "utils/snippets";
import abbyScreenshot from "../../public/screenshot.png";
import { NextPageWithLayout } from "./_app";
import { DevtoolsArrow } from "components/DevtoolsArrow";
import { useTracking } from "lib/tracking";

const { useAbby, AbbyProvider, useFeatureFlag, __abby__, withDevtools } =
  createAbby({
    projectId: "clk8ld04v0000l0085dqsxpsr",
    currentEnvironment: "production",
    environments: ["production", "development"],
    tests: {
      SignupButton: {
        variants: ["A", "B", "C"],
      },
      heroMedia: {
        variants: ["Image", "Video"],
      },
    },
    flags: ["ForceDarkTheme"],
  });

const Devtools = withDevtools(DevtoolsFactory, {
  dangerouslyForceShow: true,
});

const AmpersandIcon = ({ className }: { className?: string }) => (
  <svg
    width="95"
    height="101"
    viewBox="0 0 95 101"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.3337 97.1621L15.3271 97.1592C10.6573 95.0532 6.90695 91.9612 4.12888 87.8867L4.11426 87.8652L4.10019 87.8434C1.38285 83.6268 0.0693359 78.6271 0.0693359 72.936C0.0693359 68.7908 0.992738 64.8959 2.84516 61.2802C4.6738 57.6261 7.22397 54.3573 10.4686 51.4732L10.4788 51.4641L10.489 51.4553C12.8467 49.4162 15.4862 47.6775 18.3995 46.2349C17.2184 44.93 16.1387 43.594 15.1619 42.2265L15.1523 42.213L15.1429 42.1995C13.3503 39.6002 11.9458 36.9339 10.9436 34.2005C9.92393 31.4196 9.41334 28.5412 9.41334 25.576C9.41334 20.6226 10.6564 16.2148 13.2053 12.4345C15.7185 8.62189 19.1558 5.66294 23.4622 3.55556L23.4696 3.55193L23.4771 3.54836C27.888 1.4348 32.9286 0.40799 38.5493 0.40799C43.6763 0.40799 48.2691 1.44203 52.2683 3.57544C56.3223 5.60756 59.5396 8.49144 61.8713 12.2184C64.2276 15.8984 65.3813 20.1176 65.3813 24.808C65.3813 28.5927 64.5944 32.1362 63.0044 35.4098C61.4207 38.6702 59.1443 41.4968 56.2067 43.8863C53.9583 45.7703 51.4327 47.3834 48.6387 48.7307L60.3246 61.605C60.6035 60.8805 60.8483 60.1018 61.0571 59.2669L61.0665 59.2293L61.0773 59.192C61.651 57.2251 62.1021 55.216 62.4305 53.164L62.4366 53.1258L62.4442 53.0878C62.8455 51.081 63.0453 49.079 63.0453 47.08V45.08H90.5973V63.16H79.3689C79.0137 64.7933 78.5349 66.4433 77.9351 68.1094C77.1387 70.3217 76.207 72.4109 75.1382 74.3744C74.761 75.1269 74.3682 75.8456 73.9594 76.5295L94.7013 99H66.5916L58.9082 90.5347C56.0152 93.3545 52.4425 95.571 48.2313 97.2011L48.2231 97.2043L48.2149 97.2074C42.7778 99.2575 37.0769 100.28 31.1253 100.28C25.3398 100.28 20.0665 99.2555 15.3403 97.1651L15.3337 97.1621ZM57.563 89.0527C58.0423 88.5828 58.5006 88.0957 58.9377 87.5915L67.4773 97H90.1333L71.4462 76.7556C71.6949 76.3886 71.9388 76.0072 72.1778 75.6114C72.3001 75.4089 72.4211 75.2027 72.5408 74.9928C72.8226 74.4987 73.0974 73.9838 73.3653 73.448C74.3893 71.5707 75.2853 69.5653 76.0533 67.432C76.8213 65.2987 77.376 63.208 77.7173 61.16H88.5973V47.08H65.0453C65.0453 49.2133 64.832 51.3467 64.4053 53.48C64.064 55.6133 63.5947 57.704 62.9973 59.752C62.6823 61.0121 62.2865 62.1752 61.81 63.2415C61.512 63.9082 61.1825 64.537 60.8213 65.128L45.7173 48.488V47.848C46.177 47.6574 46.6293 47.4602 47.0743 47.2563C47.1275 47.2319 47.1807 47.2074 47.2337 47.1828C50.1106 45.8492 52.6772 44.2363 54.9333 42.344C57.664 40.1253 59.7547 37.5227 61.2053 34.536C62.656 31.5493 63.3813 28.3067 63.3813 24.808C63.3813 20.456 62.3147 16.616 60.1813 13.288C58.048 9.87466 55.104 7.22932 51.3493 5.35199C47.68 3.38932 43.4133 2.40799 38.5493 2.40799C33.1733 2.40799 28.4373 3.38932 24.3413 5.35199C20.3307 7.31466 17.1733 10.0453 14.8693 13.544C12.5653 16.9573 11.4133 20.968 11.4133 25.576C11.4133 28.3067 11.8827 30.952 12.8213 33.512C13.76 36.072 15.0827 38.5893 16.7893 41.064C17.8329 42.525 19.0041 43.9541 20.3029 45.3513C20.6423 45.7164 20.9904 46.0793 21.3472 46.44C21.4959 46.5904 21.6462 46.7403 21.7979 46.8899C21.507 47.0101 21.2188 47.1329 20.9333 47.2585C20.5641 47.4208 20.1993 47.5877 19.8391 47.7591C16.8464 49.1833 14.1658 50.9196 11.7973 52.968C8.72534 55.6987 6.336 58.7707 4.62934 62.184C2.92267 65.512 2.06934 69.096 2.06934 72.936C2.06934 78.312 3.30667 82.92 5.78134 86.76C8.34134 90.5147 11.7973 93.3733 16.1493 95.336C20.5867 97.2987 25.5787 98.28 31.1253 98.28C36.8427 98.28 42.304 97.2987 47.5093 95.336C51.5238 93.782 54.8751 91.6875 57.563 89.0527ZM48.6562 76.2638C48.5788 76.3712 48.5001 76.4773 48.4202 76.5822C48.09 77.0153 47.7381 77.4268 47.3647 77.8166C46.2428 78.9876 44.9257 79.9634 43.4133 80.744C40.768 82.1093 37.696 82.792 34.1973 82.792C31.6373 82.792 29.3333 82.3227 27.2853 81.384C25.3227 80.4453 23.744 79.08 22.5493 77.288C21.44 75.4107 20.8853 73.192 20.8853 70.632C20.8853 68.4987 21.2693 66.5787 22.0373 64.872C22.8907 63.08 24.0853 61.544 25.6213 60.264C27.1573 58.8987 28.9493 57.7467 30.9973 56.808L48.6562 76.2638ZM46.0167 76.3314L30.5329 59.2721C29.19 59.9969 27.9982 60.8271 26.9501 61.7588L26.9262 61.78L26.9017 61.8004C25.5916 62.8922 24.5799 64.1915 23.8524 65.7123C23.2214 67.1227 22.8853 68.7508 22.8853 70.632C22.8853 72.8739 23.3636 74.7135 24.2439 76.224C25.2299 77.6865 26.5159 78.7961 28.1338 79.5728C29.8833 80.3718 31.8924 80.792 34.1973 80.792C37.4327 80.792 40.1801 80.1621 42.4961 78.9668C43.8565 78.2646 45.0272 77.3881 46.0167 76.3314ZM44.0559 30.5698L44.0755 30.5325C44.7812 29.1917 45.1253 27.8039 45.1253 26.344C45.1253 24.2468 44.4802 22.6872 43.2791 21.4862L43.2419 21.449L43.2067 21.4099C42.096 20.1758 40.6149 19.512 38.5493 19.512C36.9836 19.512 35.7431 19.8644 34.7453 20.488L34.7061 20.5125L34.6659 20.5351C33.6198 21.1236 32.8169 21.9264 32.2285 22.9725C31.6349 24.0278 31.3333 25.1816 31.3333 26.472C31.3333 27.7342 31.576 28.9626 32.0705 30.1706C32.5928 31.3597 33.3102 32.5755 34.2382 33.8171C35.0799 34.8507 35.9728 35.8322 36.9172 36.7618C38.6032 36.0315 39.9934 35.1974 41.1134 34.2759C42.4498 33.1612 43.4084 31.9367 44.0379 30.6078L44.0559 30.5698ZM42.3893 35.816C40.9387 37.0107 39.1467 38.0347 37.0133 38.888H36.2453C34.9653 37.6933 33.7707 36.4133 32.6613 35.048C31.6373 33.6827 30.8267 32.3173 30.2293 30.952C29.632 29.5013 29.3333 28.008 29.3333 26.472C29.3333 24.8507 29.7173 23.3573 30.4853 21.992C31.2533 20.6267 32.32 19.56 33.6853 18.792C35.0507 17.9387 36.672 17.512 38.5493 17.512C41.1093 17.512 43.1573 18.3653 44.6933 20.072C46.3147 21.6933 47.1253 23.784 47.1253 26.344C47.1253 28.136 46.6987 29.8427 45.8453 31.464C45.0773 33.0853 43.9253 34.536 42.3893 35.816Z"
      fill="#F9A8D4"
    />
  </svg>
);

const Home: NextPageWithLayout<
  Omit<InferGetStaticPropsType<typeof getStaticProps>, "abbyData">
> = ({ codeSnippet }) => {
  const { setTheme } = useTheme();
  const { onAct, variant } = useAbby("SignupButton");
  const { variant: heroMediaVariant, onAct: onHeroMediaAct } =
    useAbby("heroMedia");

  const forceDarkTheme = useFeatureFlag("ForceDarkTheme");

  const trackEvent = useTracking();

  useEffect(() => {
    if (forceDarkTheme) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }, [forceDarkTheme, setTheme]);

  return (
    <>
      <Devtools />
      <section
        className={twMerge(
          "min-h-screen bg-primary-background text-primary-foreground",
          forceDarkTheme && "dark"
        )}
      >
        <div className="flex flex-col items-center px-6 pb-12 pt-24 md:px-16">
          <div className="relative">
            <AmpersandIcon className="absolute -right-48 -top-6 hidden h-48 w-48 lg:block" />
            <h1 className="text-center text-5xl font-extrabold">
              Dead-Simple <span className="mark">Feature Flags</span> <br />
              <span className="inline lg:hidden">&</span>
              <br />
              Effortless <span className="mark">Remote Config</span>
            </h1>
          </div>
          <h2 className="mx-auto mt-16 max-w-2xl text-center leading-relaxed">
            Abby enables modern teams to speed up their development cycles and
            and release with confidence. <br />
            With its first class developer experience, Abby is the perfect
            solution for every software development team.
            <span className="mt-4 block font-semibold">
              Built by Developers for Developers.
            </span>
          </h2>

          <div className="flex flex-col items-center">
            <Link
              href="/login"
              onClick={() => {
                trackEvent("Sign Up Clicked");
                onAct();
                onHeroMediaAct();
              }}
              className={twMerge(
                "mt-12 rounded-xl bg-accent-background px-6 py-2 text-xl font-semibold text-accent-foreground no-underline transition-transform duration-150 ease-in-out hover:scale-110"
              )}
            >
              {variant === "A" && "Test Now"}
              {variant === "B" && "Sign Up for Free"}
              {variant === "C" && "Get Started"}
            </Link>
            <span className="mt-4 text-xs">
              Free forever. No Credit Card required
            </span>
          </div>
          {heroMediaVariant === "Image" && (
            <Image
              src={abbyScreenshot}
              alt="Screenshot of Abby's Dashboard"
              className="mt-12 hidden w-10/12 rounded-xl border border-accent-background shadow-2xl md:block lg:max-w-5xl"
              width={1920}
              height={1080}
              priority
            />
          )}
          {heroMediaVariant === "Video" && (
            <video
              className="mt-12 hidden w-10/12 rounded-xl border border-accent-background shadow-2xl md:block lg:max-w-5xl"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            >
              <source src="/videos/hero.mp4" type="video/mp4" />
            </video>
          )}
        </div>
      </section>
      <Divider />
      <section id="features" className="py-48">
        <div className="container px-6 md:px-16">
          <h1 className="mb-6 text-center text-4xl font-bold">
            <span className="mark">Why</span> choose Abby?
          </h1>
          <h2 className="mb-8 text-center text-lg">
            Find out why Abby is the easiest and nicest solution out there.
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Feature
              icon={GiPadlock}
              title="Privacy First"
              subtitle="Avoid big companies that track you and sell your data"
            >
              Abby is all about privacy and transparency. We prove it by being
              open source.
            </Feature>
            <Feature
              icon={BsCodeSlash}
              title="Developer Friendly"
              subtitle="Enjoy a developer-friendly API and a great developer experience"
            >
              Abby was created by developers that experienced the pain of
              existing solutions.
            </Feature>
            <Feature
              icon={BsBarChartFill}
              title="Simple Analytics"
              subtitle="Analytics that everyone can understand"
            >
              Abby focuses on simple analytics and easy-to-read reports so that
              you don&apos;t have to be a data scientist to understand
              what&apos;s going on.
            </Feature>
            <Feature
              icon={Clock}
              title="Integrate in minutes"
              subtitle="Fast Implementation"
            >
              Start using Abby in under 5 minutes. Simply integrate it in your
              code and you&apos;re ready to go.
            </Feature>
            <Feature
              icon={Shield}
              title="The safe and reliable Feature Flagging tool"
              subtitle="Downtime Secure"
            >
              Abby ensures a stable testing environment. Abbys SDKs have built
              in fallbacks to ensure that your users will never experience any
              downtime.
            </Feature>
            <Feature
              icon={FlaskConical}
              title="Environments"
              subtitle="Test safely"
            >
              Utilize different environments for each feature flag or remote
              config variable. Create various environments to test features
              before they go live.
            </Feature>
          </div>
        </div>
      </section>
      <Divider />
      <section className="py-48" id="devtools">
        <div className="container px-6 md:px-16">
          <h1 className="mb-6 text-center text-4xl font-bold">
            Painless Debugging with <span className="mark">Abby Devtools</span>
          </h1>
          <h2 className="mb-12 text-center text-lg ">
            Debugging your feature flags & remote config variables has never
            been easier. Simply install the optional Devtools and get started.
            <br />
            <b>Simple.</b> <b>Framework Agnostic.</b>
          </h2>
          <video
            className="mx-auto w-full max-w-4xl rounded-md shadow-2xl"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          >
            <source src="/videos/devtools.mp4" type="video/mp4" />
          </video>

          <div className="flex items-center">
            <Link
              href={`/devtools`}
              className="mx-auto mt-8 rounded-lg bg-accent-background px-4 py-2 font-semibold uppercase text-accent-foreground transition-transform duration-200 ease-in-out hover:scale-110"
            >
              Learn More about our Devtools
            </Link>
          </div>
        </div>
      </section>
      <Divider />
      <section className="py-48">
        <div className="container px-6 md:px-16">
          <h1 className="mb-6 text-center text-4xl font-bold">
            Can&apos;t wait to <span className="mark">try it</span> out?
          </h1>
          <h2 className="mb-8 text-center text-lg">
            Skip the Docs and get right into the code. Simply define your tests
            and enjoy the magic. <br />
            <b>Fully typed.</b> <b>Easy to use.</b>
          </h2>
          <div className="mx-auto max-w-4xl shadow-2xl">
            <BaseCodeSnippet
              className="rounded-md border border-accent-background"
              {...codeSnippet}
            />
          </div>
          <div className="flex items-center">
            <Link
              href={DOCS_URL}
              className="mx-auto mt-8 flex items-center space-x-2 rounded-lg bg-primary-foreground px-4 py-2 font-semibold uppercase text-primary-background transition-transform duration-200 ease-in-out hover:scale-110"
            >
              <span>Read the Docs</span>{" "}
              <ExternalLink className="-mt-1 h-5 w-5 stroke-2" />
            </Link>
          </div>
        </div>
      </section>
      <Divider />
      <section className="py-48">
        <div className="container relative px-6 md:px-16">
          <div className="relative mb-6 ">
            <div className="absolute -top-24 right-0 z-0 hidden text-accent-background md:block">
              <FaQuestion className="h-36 w-36 fill-none stroke-[6px]" />
            </div>
            <h1 className="z-10 text-center text-4xl font-bold">
              When you hear feature flags, do you think of flag lore?
            </h1>
          </div>
          <h2 className="mb-8 text-center text-lg">
            If you&apos;re not yet familiar with website optimization and
            feature testing you can learn more about the terms and background of
            A/B tests (also known as Split tests) here.
          </h2>
          <div className="flex items-center">
            <Link
              href={`/tips-and-insights`}
              className="mx-auto mt-8 rounded-lg bg-accent-background px-4 py-2 font-semibold uppercase text-accent-foreground transition-transform duration-200 ease-in-out hover:scale-110"
            >
              Discover Tips & Insights
            </Link>
          </div>
        </div>
      </section>
      <Divider />
      <section id="pricing" className="py-48">
        <div className="container px-6 md:px-16">
          <h1 className="mb-6 text-center text-4xl font-bold">
            <span className="mark">Simple</span> pricing, for everyone
          </h1>
          <h2 className="mb-8 text-center text-lg">
            Start using feature flags & remote config variables in under 5
            minutes. Simply integrate it in your code and you&apos;re ready to
            go.
          </h2>
          <PricingTable />
        </div>
      </section>
      <Divider />
      <section className="py-48">
        <div className="container relative px-6 md:px-16">
          <div className="relative mb-6 ">
            <div className="absolute -top-24 right-0 z-0 hidden text-accent-background md:block">
              <FaQuestion className="h-36 w-36 fill-none stroke-[6px]" />
            </div>
            <h1 className="z-10 text-center text-4xl font-bold">
              Still open questions?
            </h1>
          </div>
          <h2 className="mb-8 text-center text-lg">
            Do not hesitate to reach out to us. We are happy to help you out.
          </h2>
          <div className="flex items-center">
            <Link
              href={`/contact`}
              className="mx-auto mt-8 rounded-lg bg-accent-background px-4 py-2 font-semibold text-accent-foreground transition-transform duration-200 ease-in-out hover:scale-110"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
      <DevtoolsArrow />
    </>
  );
};

const HomeWrapper: NextPageWithLayout<
  InferGetStaticPropsType<typeof getStaticProps>
> = ({ codeSnippet, abbyData }) => (
  <AbbyProvider initialData={abbyData ?? undefined}>
    <Home codeSnippet={codeSnippet} />
  </AbbyProvider>
);

HomeWrapper.getLayout = (page) => <MarketingLayout>{page}</MarketingLayout>;

export const getStaticProps = async () => {
  const config = __abby__.getConfig();
  const data = await HttpService.getProjectData({
    projectId: config.projectId,
    environment: config.currentEnvironment,
  });
  const codeSnippet = await generateCodeSnippets({
    projectId: "<PROJECT_ID>",
    tests: [
      {
        name: "footer",
        options: [
          {
            identifier: "oldFooter",
          },
          {
            identifier: "newFooter",
          },
        ],
      },
      {
        name: "ctaButton",
        options: [
          {
            identifier: "dark",
          },
          {
            identifier: "light",
          },
          {
            identifier: "cyberpunk",
          },
        ],
      },
    ],
    flags: [
      {
        name: "showPrices",
        type: "BOOLEAN",
      },
      {
        name: "userLimit",
        type: "NUMBER",
      },
      {
        name: "appMode",
        type: "STRING",
      },
    ],
  });

  return {
    props: {
      abbyData: data,
      codeSnippet,
    },
  };
};

export default HomeWrapper;
