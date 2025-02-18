import Cal, { getCalApi } from "@calcom/embed-react";
import { DISCORD_INVITE_URL } from "components/Footer";
import { Input } from "components/Input";
import { RadioGroupComponent } from "components/RadioGroup";
import { Button } from "components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "lib/utils";
import { ChevronRight } from "lucide-react";
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

const FormItem = ({
  children,
  labelText,
}: { children: React.ReactNode; labelText: string }) => (
  <div className="grid w-full max-w-sm items-center gap-1.5">
    <Label>{labelText}</Label>
    {children}
  </div>
);

function WizardFooter() {
  const { previousStep, nextStep, isFirstStep, isLastStep, activeStep } =
    useWizard();
  const { name, technologies } = useOnboardingStore();

  // Variable to check if next button should be disabled on current step
  const nextDisabled =
    (activeStep === 0 && name.length < 2) ||
    (activeStep === 2 && technologies.length === 0);

  return (
    <CardFooter className="flex justify-between">
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
    </CardFooter>
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
      <CardHeader>
        <CardTitle>Welcome to Abby</CardTitle>
        <CardDescription>
          Thank you very much for signing up for Abby
        </CardDescription>
      </CardHeader>
      <CardContent>
        <label htmlFor="name">
          <span>Name</span>
          <Input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
      </CardContent>
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
      <CardHeader>
        <CardTitle>About you</CardTitle>
        <CardDescription>Tell us more about you</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col space-y-5">
        <FormItem labelText="Your current role">
          <Select value={profession} onValueChange={setProfession}>
            <SelectTrigger className="-ml-1">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem
                  key={role}
                  onClick={() => setProfession(role)}
                  value={role}
                >
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
        <FormItem labelText="How would you rate your experience with Feature Flags">
          <RadioGroupComponent
            items={oneToFiveOptions}
            value={experienceLevelFlags.toString()}
            onChange={(value) => setExperienceLevelFlags(Number(value))}
          />
          <small className="text-xs text-gray-400">
            1 is no experience - 5 is very frequent usage
          </small>
        </FormItem>
        <FormItem labelText="How would you rate your experience with A/B Testing">
          <RadioGroupComponent
            items={oneToFiveOptions}
            value={experienceLevelTests.toString()}
            onChange={(value) => setExperienceLevelTests(Number(value))}
          />
          <small className="text-xs text-gray-400">
            1 is no experience - 5 is very frequent usage
          </small>
        </FormItem>
      </CardContent>
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
      <CardHeader>
        <CardTitle>Technical Background</CardTitle>
        <CardDescription>
          What technologies do you use currently?
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col space-y-5">
        <div className="grid grid-cols-4 gap-4">
          {TECHNOLOGIES.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              className={cn(
                "flex aspect-square w-full flex-col items-center justify-center space-y-3 rounded-sm border border-gray-600 p-2 transition-colors hover:bg-ab_primary-background",
                "data-[selected='true']:border-white"
              )}
              data-selected={technologies.includes(name)}
              onClick={() => {
                toggleTechnology(name);
              }}
            >
              <Icon className="h-6 w-6" />
              <p className="font-medium">{name}</p>
            </button>
          ))}
        </div>
      </CardContent>
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
      <CardHeader>
        <CardTitle>You&apos;re ready to go!</CardTitle>
        <CardDescription>
          Thank you very much for signing up to Abby. You&apos;re now ready to
          start using Abby.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-12 text-lg">
        <p>
          If you have any questions, feel free to join our{" "}
          <Link className="text-ab_accent-background" href={DISCORD_INVITE_URL}>
            Discord
          </Link>{" "}
          or book a free 1:1 onboarding session with us.
          <br />
          <br />
          <Cal
            namespace="abby-onboarding"
            calLink="cstrnt/abby-onboarding"
            style={{ width: "100%", height: "100%", overflow: "scroll" }}
          />
        </p>
        <Link href="/projects">
          <Button className="mx-auto mt-12 w-[150px] flex items-center">
            Go to Abby <ChevronRight size={18} />
          </Button>
        </Link>
      </CardContent>
    </motion.div>
  );
}

export default function WelcomePage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  useEffect(() => {
    useOnboardingStore.getState().setName(props.user.name ?? "");
  }, [props.user.name]);

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "abby-onboarding" });
      cal("ui", {
        theme: "dark",
        styles: { branding: { brandColor: "#f9a8d4" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ab_primary-background text-ab_primary-foreground">
      <Card className="max-w-[80vw] min-w-[500px]">
        <Wizard
          footer={<WizardFooter />}
          wrapper={<AnimatePresence mode="wait" />}
        >
          <Step1 />
          <Step2 />
          <Step3 />
          <Step4 />
        </Wizard>
      </Card>
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
