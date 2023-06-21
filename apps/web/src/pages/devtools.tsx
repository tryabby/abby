import { MarketingLayout } from "components/MarketingLayout";
import { NextPageWithLayout } from "./_app";

import { createAbby } from "@tryabby/next";
import abbyDevtools from "@tryabby/devtools";
import { cn } from "lib/utils";
import { InferGetStaticPropsType } from "next";
import { useEffect, useState } from "react";
import { CornerRightDown } from "lucide-react";
import { Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import { SignupButton } from "components/SignupButton";

const config = {
  projectId: "clha6feng0002l709segjhb2d",
  currentEnvironment: process.env.NODE_ENV,
  tests: {
    MarketingButton: {
      variants: ["Dark", "Funky", "Light"],
    },
  },
  flags: ["ToggleMeIfYoureExcited", "showEasterEgg", "showHeading"],
};

const { useAbby, AbbyProvider, useFeatureFlag, withDevtools, __abby__ } =
  createAbby(config);

export const AbbyProdDevtools = withDevtools(abbyDevtools, {
  dangerouslyForceShow: true,
});

const DevtoolsPage = () => {
  const [devtoolsPosition, setDevtoolsPosition] = useState<DOMRect | null>(
    null
  );

  const showEasterEgg = useFeatureFlag("showEasterEgg");
  const showHeading = useFeatureFlag("showHeading");
  const isExcited = useFeatureFlag("ToggleMeIfYoureExcited");
  const { variant, onAct } = useAbby("MarketingButton");

  useEffect(() => {
    const devtools = document.getElementById("devtools-collapsed");
    if (!devtools) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;

      setDevtoolsPosition(devtools.getBoundingClientRect());
    });

    resizeObserver.observe(devtools);

    setDevtoolsPosition(devtools.getBoundingClientRect());

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <section className="container relative px-6 font-mono lg:px-16">
        <div className="flex flex-col items-center">
          <div className="flex min-h-screen flex-col py-12 lg:py-24">
            <h1 className="mb-8 text-center text-4xl font-extrabold leading-loose lg:text-5xl lg:leading-normal">
              Quit the{" "}
              <span className="block lg:inline">
                <code className="rounded-md bg-zinc-700 px-2 py-1 text-lg md:text-2xl lg:text-5xl">
                  console.<span className="text-blue-300">log</span>(
                  <span className="text-green-300">&quot;Flag is &quot;</span>{" "}
                  <span className="text-orange-300"> + </span>isOn)
                </code>
              </span>
            </h1>
            <div className="space-y-4 text-center text-lg font-medium text-gray-400 lg:text-2xl">
              <h2>
                Debugging is already hard, Debugging a Service is even harder 😮‍💨
              </h2>
              <h2 className="font-semibold text-pink-500">
                A/BBY is here to help you with that
              </h2>
            </div>
            <video
              className="mx-auto mt-24 w-full max-w-3xl rounded-md shadow-xl shadow-gray-100/10 xl:max-w-5xl"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            >
              <source src="/videos/devtools.mp4" type="video/mp4" />
            </video>
            <span className="mt-12 text-center text-[10px] text-zinc-400 lg:text-xs">
              Psst: If you&apos;re already too excited, just look at the bottom
              right{" "}
              {isExcited && (
                <>
                  <br />
                  <span className="bg-gradient-to-t from-purple-400 to-pink-500 bg-clip-text font-bold text-transparent">
                    I knew it ! (you can see the other stuff at the bottom of
                    the page. Scroll down)
                  </span>
                </>
              )}
            </span>
          </div>
          <div className="relative h-full w-screen bg-zinc-800 py-24 text-center">
            <div className="mb-24">
              <h2 className="text-2xl font-bold lg:text-4xl">
                Your Developers:
              </h2>
              <span className="-mt-2 text-[10px] text-zinc-400 lg:text-xs">
                (results may differ)
              </span>
            </div>
            <div className="grid grid-cols-1 items-center gap-y-12 lg:grid-cols-[1fr,auto,1fr]">
              <div className="flex flex-col items-center space-y-3">
                <h3 className="text-2xl font-bold">Before A/BBY Devtools</h3>
                <img
                  loading="lazy"
                  height={200}
                  width={340}
                  src="https://media0.giphy.com/media/9o9dh1JRGThC1qxGTJ/giphy.gif"
                />
              </div>
              <h3 className="bg-gradient-to-r from-yellow-400 to-orange-600 bg-clip-text text-3xl font-extrabold text-transparent lg:text-5xl">
                VS.
              </h3>
              <div className="flex flex-col items-center space-y-3">
                <h3 className="text-2xl font-bold text-pink-500">
                  After A/BBY Devtools
                </h3>
                <img
                  loading="lazy"
                  height={200}
                  width={340}
                  src="https://media0.giphy.com/media/8xgqLTTgWqHWU/giphy.gif"
                />
              </div>
            </div>
          </div>
        </div>

        <section className="my-12">
          <h3 className="mb-12 text-2xl font-semibold leading-loose lg:leading-normal">
            And the best thing: You&apos;re just one{" "}
            <code className="block rounded-md bg-zinc-700 px-2 py-1 text-lg lg:inline-block lg:text-2xl">
              <span className="text-blue-300">npm</span> i @tryabby/devtools
            </code>{" "}
            away
          </h3>
          <h4 className="text-lg">
            But let&apos; be honest, you just don&apos;t add something to your
            application, right? No worries
          </h4>
          <button
            type="button"
            className={cn(
              "mb-3 mt-12 rounded-lg px-5 py-2.5 font-medium focus:ring-4",
              variant === "Light" &&
                "bg-blue-700 text-white hover:bg-blue-800 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
              variant === "Dark" &&
                "bg-gray-800 text-white hover:bg-gray-900 focus:outline-none focus:ring-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700",
              variant === "Funky" &&
                "bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700  text-white shadow-lg shadow-purple-500/50 hover:bg-gradient-to-br focus:outline-none focus:ring-purple-300 dark:shadow-lg dark:shadow-purple-800/80 dark:focus:ring-purple-800"
            )}
            onClick={() => {
              window.postMessage("abby:open-devtools");
            }}
          >
            Just click here
          </button>
          <div className="flex flex-col items-center space-y-6">
            {showHeading && (
              <h1 className="h-7 text-xl">You just toggled me!</h1>
            )}
            {isExcited && (
              <p className="bg-gradient-to-t from-purple-400 to-pink-500 bg-clip-text font-bold text-transparent">
                and it appears like you actually it
              </p>
            )}
            {showEasterEgg && (
              <div>
                <img
                  loading="lazy"
                  height={200}
                  width={340}
                  alt="Rick Astley - Never Gonna Give You Up"
                  src="https://media0.giphy.com/media/Ju7l5y9osyymQ/giphy.gif?cid=ecf05e47ff0smpv9wsk1e2f2tyurfjunbdz18ff167x2k9ib&ep=v1_gifs_related&rid=giphy.gif&ct=g"
                />
                <p>You just got rickrolled</p>
              </div>
            )}
          </div>
        </section>

        <div className="flex flex-col items-center">
          <div className="relative h-full w-screen bg-zinc-800 py-24 text-center">
            <h2 className="mb-6 text-2xl font-bold lg:text-4xl">
              Ready to dive in?
            </h2>
            <p className="text-base lg:text-lg">
              Sign up for A/BBY for free and start to enjoy a Feature Flag & A/B
              Testing solution that was made for developers
            </p>
            <SignupButton className="bg-white text-zinc-900" />
          </div>
        </div>
      </section>

      <Transition
        show={devtoolsPosition != null}
        enter="transition-opacity duration-75"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          className="flex items-center font-mono text-pink-500"
          style={{
            zIndex: 9999,
            position: "fixed",
            top: (devtoolsPosition?.top ?? 0) - 40,
            left: (devtoolsPosition?.left ?? 0) - 90,
          }}
        >
          Try me out <CornerRightDown className="mt-3" />
        </div>
      </Transition>
    </>
  );
};

const OuterPage: NextPageWithLayout<
  InferGetStaticPropsType<typeof getStaticProps>
> = ({ abbyData }) => {
  return (
    <AbbyProvider initialData={abbyData!}>
      <AbbyProdDevtools />
      <DevtoolsPage />
    </AbbyProvider>
  );
};

OuterPage.getLayout = (page) => (
  <MarketingLayout isInverted seoTitle="Devtools">
    {page}
  </MarketingLayout>
);

export const getStaticProps = async () => {
  const data = await __abby__.loadProjectData();
  return {
    props: { abbyData: data },
  };
};

export default OuterPage;
