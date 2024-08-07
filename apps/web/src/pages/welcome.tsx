import { DISCORD_INVITE_URL } from "components/Footer";
import { Input } from "components/Input";
import { RadioGroupComponent } from "components/RadioGroup";
import { Select } from "components/Select";
import { Button } from "components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "lib/utils";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect } from "react";
import { BsCodeSlash } from "react-icons/bs";
import {
  FaAngular,
  FaPhp,
  FaReact,
  FaVuejs,
  FaWordpress,
} from "react-icons/fa";
import { TbBrandNextjs, TbBrandSvelte } from "react-icons/tb";
import { Wizard, useWizard } from "react-use-wizard";
import { getServerAuthSession } from "server/common/get-server-auth-session";
import { prisma } from "server/db/client";
import { trpc } from "utils/trpc";
import { create } from "zustand";

const ROLES = [
  "Frontend Engineer",
  "Backend Engineer",
  "Fullstack Engineer",
  "DevOps Engineer",
  "Product Manager",
  "Designer",
  "Data Scientist",
  "Marketing",
  "Other",
] as const;

const useOnboardingStore = create<{
  name: string;
  profession: string;
  technologies: string[];
  experienceLevelFlags: number;
  experienceLevelTests: number;
  setName: (name: string) => void;
  setProfession: (profession: string) => void;
  toggleTechnology: (technology: string) => void;
  setExperienceLevelFlags: (experienceLevelFlags: number) => void;
  setExperienceLevelTests: (experienceLevelTests: number) => void;
}>((set, get) => ({
  name: "",
  profession: ROLES[0],
  technologies: [],
  experienceLevelFlags: 1,
  experienceLevelTests: 1,
  setName: (name: string) => set({ name }),
  setProfession: (profession: string) => set({ profession }),
  toggleTechnology: (technology: string) => {
    const currentTechnologies = get().technologies;
    if (currentTechnologies.includes(technology)) {
      set({
        technologies: currentTechnologies.filter((t) => t !== technology),
      });
    } else {
      set({ technologies: [...currentTechnologies, technology] });
    }
  },
  setExperienceLevelFlags: (experienceLevelFlags: number) =>
    set({ experienceLevelFlags }),
  setExperienceLevelTests: (experienceLevelTests: number) =>
    set({ experienceLevelTests }),
}));

function WizardFooter() {
  const { previousStep, nextStep, isFirstStep, isLastStep, activeStep } =
    useWizard();
  const { name, technologies } = useOnboardingStore();

  // Variable to check if next button should be disabled on current step
  const nextDisabled =
    (activeStep === 0 && name.length < 2) ||
    (activeStep === 2 && technologies.length === 0);

  return (
    <div className="flex justify-between">
      <Button
        disabled={isFirstStep}
        onClick={previousStep}
        className={cn(isFirstStep && "invisible")}
      >
        Back
      </Button>
      <Button
        disabled={nextDisabled}
        onClick={nextStep}
        className={cn(isLastStep && "invisible")}
      >
        Next
      </Button>
    </div>
  );
}

function Step1() {
  const { name, setName } = useOnboardingStore();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <h1 className="mb-1 text-3xl font-semibold">Welcome to Abby</h1>
      <p>Thank you very much for signing up for Abby</p>

      <form className="mt-6 space-y-3">
        <label>
          <span>Name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      </form>
    </motion.div>
  );
}

const oneToFiveOptions = Array.from({ length: 5 }, (_, i) => i + 1).map(
  (i) => ({
    label: i.toString(),
    value: i.toString(),
  })
);

function Step2() {
  const {
    profession,
    setProfession,
    experienceLevelFlags,
    experienceLevelTests,
    setExperienceLevelTests,
    setExperienceLevelFlags,
  } = useOnboardingStore();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <h1 className="mb-1 text-3xl font-semibold">About you</h1>

      <form className="mt-6 flex flex-col space-y-5">
        <label>
          <span>Role</span>
          <Select
            items={ROLES.map((r) => ({ label: r, value: r }))}
            value={profession}
            onChange={(value) => setProfession(value)}
          />
        </label>
        <label>
          <span>How would you rate your experience with Feature Flags</span>
          <RadioGroupComponent
            items={oneToFiveOptions}
            value={experienceLevelFlags.toString()}
            onChange={(value) => setExperienceLevelFlags(Number(value))}
          />
          <small className="text-xs text-gray-400">
            1 is no experience - 5 is very frequent usage
          </small>
        </label>
        <label>
          <span>How would you rate your experience with A/B Testing</span>
          <RadioGroupComponent
            items={oneToFiveOptions}
            value={experienceLevelTests.toString()}
            onChange={(value) => setExperienceLevelTests(Number(value))}
          />
          <small className="text-xs text-gray-400">
            1 is no experience - 5 is very frequent usage
          </small>
        </label>
      </form>
    </motion.div>
  );
}

const TECHNOLOGIES = [
  {
    name: "React (CRA/Vite)",
    icon: FaReact,
  },
  {
    name: "Next.js",
    icon: TbBrandNextjs,
  },
  {
    name: "Vue",
    icon: FaVuejs,
  },
  {
    name: "Angular",
    icon: FaAngular,
  },
  {
    name: "Svelte",
    icon: TbBrandSvelte,
  },
  {
    name: "Wordpress",
    icon: FaWordpress,
  },
  {
    name: "PHP",
    icon: FaPhp,
  },
  {
    name: "Other",
    icon: BsCodeSlash,
  },
] satisfies Array<{
  name: string;
  icon: <P extends { className?: string }>(
    props: P
  ) => React.ReactElement<P, string | React.JSXElementConstructor<P>> | null;
}>;

function Step3() {
  const { handleStep } = useWizard();
  const { technologies, toggleTechnology } = useOnboardingStore();
  const onboardUserMutation = trpc.user.onboardUser.useMutation();
  const { update } = useSession();

  handleStep(async () => {
    await update({
      name: useOnboardingStore.getState().name,
      hasCompletedOnboarding: true,
    });
    return onboardUserMutation.mutateAsync(useOnboardingStore.getState());
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <h1 className="mb-1 text-3xl font-semibold">Technical Background</h1>

      <form className="mt-6 flex flex-col space-y-5">
        <label>What technologies do you use currently?</label>
        <div className="grid grid-cols-4 gap-4">
          {TECHNOLOGIES.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              className={cn(
                "flex aspect-square w-full flex-col items-center justify-center space-y-3 rounded-sm border border-gray-100 p-2 transition-colors",
                "data-[selected='true']:border-pink-500 data-[selected='true']:bg-gray-800"
              )}
              data-selected={technologies.includes(name)}
              onClick={() => {
                toggleTechnology(name);
              }}
            >
              <Icon className="h-6 w-6" />
              <p>{name}</p>
            </button>
          ))}
        </div>
      </form>
    </motion.div>
  );
}

function Step4() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <h1 className="mb-1 text-3xl font-semibold">You&apos;re ready to go!</h1>
      <div className="mt-12 text-lg">
        <p>
          Thank you very much for signing up to Abby
          <br />
          <br />
          If you have any questions, feel free to join our{" "}
          <Link className="text-pink-500" href={DISCORD_INVITE_URL}>
            Discord
          </Link>{" "}
          or send us an email to{" "}
          <a className="text-pink-500" href="mailto:tim@tryabby.com">
            tim@tryabby.com
          </a>
          <br />
          <br />
          You can also book a <b>free</b> 30 minute onboarding call with us to
          get you started. Feel free to pick a time that works for you{" "}
          <a
            className="text-pink-500"
            href="https://cal.com/cstrnt/abby-onboarding"
          >
            here
          </a>
        </p>
        <Link href="/projects">
          <Button className="mx-auto mt-12 block w-[150px] bg-pink-500 font-semibold text-white hover:bg-pink-600">
            Go to Abby
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function WelcomePage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  useEffect(() => {
    useOnboardingStore.getState().setName(props.user.name ?? "");
  }, [props.user.name]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ab_primary-background text-ab_primary-foreground">
      <div className="flex h-[500px] w-full max-w-2xl flex-col rounded-md border border-ab_accent-background-muted bg-ab_primary-background p-8 text-ab_primary-foreground shadow-md shadow-ab_accent-background">
        <Wizard
          footer={<WizardFooter />}
          wrapper={
            <div className="mb-6 flex flex-1">
              <AnimatePresence mode="wait" />
            </div>
          }
        >
          <Step1 />
          <Step2 />
          <Step3 />
          <Step4 />
        </Wizard>
      </div>
    </main>
  );
}

export const getServerSideProps = (async (ctx) => {
  const session = await getServerAuthSession(ctx);

  if (!session?.user) {
    throw new Error("No session");
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    });

    if (!user) {
      throw new Error("No user");
    }

    if (user.hasCompletedOnboarding) {
      return {
        redirect: {
          destination: "/projects",
          permanent: false,
        },
      };
    }

    return {
      props: {
        user: {
          name: user.name,
        },
      },
    };
  } catch (_error) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
}) satisfies GetServerSideProps;
