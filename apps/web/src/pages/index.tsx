import { DOCS_URL } from "@tryabby/core";
import { BaseCodeSnippet } from "components/CodeSnippet";
import { Feature } from "components/Feature";
import { MarketingLayout } from "components/MarketingLayout";
import { PricingTable } from "components/Pricing";
import { SignupButton } from "components/SignupButton";
import { InferGetStaticPropsType } from "next";
import Image from "next/image";
import Link from "next/link";
import { BsBarChartFill, BsCodeSlash } from "react-icons/bs";
import { GiPadlock } from "react-icons/gi";
import { RiGameFill } from "react-icons/ri";
import { generateCodeSnippets } from "utils/snippets";
import abbyScreenshot from "../../public/screenshot.png";
import { NextPageWithLayout } from "./_app";

const Home: NextPageWithLayout<
  InferGetStaticPropsType<typeof getStaticProps>
> = ({ codeSnippet }) => {
  return (
    <>
      <section className="min-h-screen bg-pink-100 text-gray-900">
        <div className="flex flex-col items-center px-6 pb-12 pt-24 md:px-16">
          <h1 className="text-center text-5xl font-extrabold">
            Dead-Simple <span className="mark">A/B Testing</span> <br /> &
            <br />
            Effortless <span className="mark">Feature Flags</span>
          </h1>
          <h2 className="mx-auto my-5 max-w-2xl text-center text-xl leading-relaxed">
            A/BBY makes it easy to test your components and toggle your
            features. Forget about complex setups and complicated integrations.
            <span className="mt-4 block">
              Built by Developers{" "}
              <span className="underline decoration-pink-400 decoration-wavy decoration-2 underline-offset-4">
                for Developers.
              </span>
            </span>
          </h2>

          <SignupButton />
          <Image
            src={abbyScreenshot}
            alt="Screenshot of A/BBY's Dashboard"
            className="mt-12 hidden w-10/12 rounded-xl shadow-2xl md:block lg:max-w-5xl"
            priority
          />
        </div>
      </section>
      <section id="features" className="bg-white py-48">
        <div className="container px-6 md:px-16">
          <h1 className="mb-6 text-center text-4xl font-bold">
            Why choose A/BBY?
          </h1>
          <h2 className="mb-8 text-center text-lg text-gray-700">
            Find out why A/BBY is the easiest and nicest solution out there.
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Feature
              icon={GiPadlock}
              title="Privacy First"
              subtitle="Avoid big companies that track you and sell your data"
            >
              A/BBY is all about privacy and transparency. We prove this by
              being Open-Source. You and your users will thank you.
            </Feature>
            <Feature
              icon={BsCodeSlash}
              title="Developer Friendly"
              subtitle="Enjoy a developer-friendly API and a great developer experience"
            >
              A/BBY was created by developers that experienced the pain of
              existing solutions.
            </Feature>
            <Feature
              icon={BsBarChartFill}
              title="Simple Analytics"
              subtitle="Analytics that everyone can understand"
            >
              A/BBY focuses on simple analytics and easy-to-read reports so that
              you don&apos;t have to be a data scientist to understand
              what&apos;s going on.
            </Feature>
            <Feature
              icon={RiGameFill}
              title="Easy to use"
              subtitle="So easy that even your grandma can use it"
            >
              Start testing your components in under 5 minutes. Simply integrate
              it in your code and you&apos;re ready to go.
            </Feature>
          </div>
        </div>
      </section>
      <section className="h-3 bg-pink-100" />
      <section className="bg-white py-48" id="devtools">
        <div className="container px-6 md:px-16">
          <h1 className="mb-6 text-center text-4xl font-bold">
            Painless Debugging with <span className="mark">A/BBY Devtools</span>
          </h1>
          <h2 className="mb-12 text-center text-lg text-gray-700">
            Debugging your tests & Feature Flags has never been easier. Simply
            install the optional Devtools and get started.
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
              className="mx-auto mt-8 rounded-lg bg-gray-900 px-4 py-2 text-white transition-transform duration-200 ease-in-out hover:scale-110"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
      <section className="h-3 bg-pink-100" />
      <section className="bg-white py-48">
        <div className="container px-6 md:px-16">
          <h1 className="mb-6 text-center text-4xl font-bold">
            Can&apos;t wait to try it out?
          </h1>
          <h2 className="mb-8 text-center text-lg text-gray-700">
            Skip the Docs and get right into the code. Simply define your tests
            and enjoy the magic. <br />
            <b>Fully typed.</b> <b>Easy to use.</b>
          </h2>
          <div className="mx-auto max-w-4xl shadow-2xl">
            <BaseCodeSnippet {...codeSnippet} />
          </div>
          <div className="flex items-center">
            <Link
              href={DOCS_URL}
              className="mx-auto mt-8 rounded-lg bg-gray-900 px-4 py-2 text-white transition-transform duration-200 ease-in-out hover:scale-110"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      </section>
      <section className="h-3 bg-pink-100" />
      <section id="pricing" className="bg-white py-48">
        <div className="container px-6 md:px-16">
          <h1 className="mb-6 text-center text-4xl font-bold">
            Simple pricing, for everyone
          </h1>
          <h2 className="mb-8 text-center text-lg text-gray-700">
            Start testing your components in under 5 minutes. Simply integrate
            it in your code and you&apos; ready to go.
          </h2>
          <PricingTable />
        </div>
      </section>
    </>
  );
};

Home.getLayout = (page) => <MarketingLayout>{page}</MarketingLayout>;

export const getStaticProps = async () => {
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
      codeSnippet,
    },
  };
};

export default Home;
