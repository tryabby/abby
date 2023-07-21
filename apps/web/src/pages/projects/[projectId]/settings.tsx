import { ROLE, User } from "@prisma/client";
import clsx from "clsx";
import { IconButton } from "components/IconButton";
import { Layout } from "components/Layout";
import {
  FullPageLoadingSpinner,
  LoadingSpinner,
} from "components/LoadingSpinner";
import { Progress } from "components/Progress";
import { RemoveUserModal } from "components/RemoveUserModal";
import dayjs from "dayjs";
import { getFlagCount } from "lib/flags";
import { getProjectPaidPlan, useAbbyStripe } from "lib/stripe";
import Link from "next/link";
import { useRouter } from "next/router";
import { NextPageWithLayout } from "pages/_app";
import { FormEvent, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { BsX } from "react-icons/bs";
import { getLimitByPlan } from "server/common/plans";
import { trpc } from "utils/trpc";

const SettingsPage: NextPageWithLayout = () => {
  const [userToRemove, setUserToRemove] = useState<User | null>(null);
  const inviteEmailRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const projectId = router.query.projectId as string;
  const projectNameRef = useRef<HTMLInputElement>(null);
  const trpcContext = trpc.useContext();
  const { data, isLoading, isError } = trpc.project.getProjectData.useQuery({
    projectId,
  });

  const limits = data
    ? getLimitByPlan(getProjectPaidPlan(data?.project))
    : null;

  const { mutate: updateProjectName } = trpc.project.updateName.useMutation({
    onSuccess() {
      toast.success("Project name updated");
      trpcContext.project.getProjectData.invalidate();
      trpcContext.user.getProjects.invalidate();
    },
  });

  const { mutateAsync } = trpc.invite.createInvite.useMutation();

  const { redirectToCheckout, redirectToBillingPortal } = useAbbyStripe();

  const onInvite = async (e: FormEvent) => {
    e.preventDefault();

    const email = inviteEmailRef.current?.value;
    if (!email) return;

    toast.promise(
      (async () => {
        await mutateAsync({
          projectId,
          email,
        });
        inviteEmailRef.current!.value = "";
      })(),
      {
        error: "Failed to send invite",
        loading: "Sending invite...",
        success: "Invite sent",
      }
    );
  };

  return (
    <main className="space-y-8 text-pink-50">
      <h1 className="text-3xl font-bold">Project Settings</h1>
      {isLoading || isError ? (
        <FullPageLoadingSpinner />
      ) : (
        <>
          <section className="rounded-xl bg-gray-800 px-6 py-3">
            <h2 className="mb-8 text-xl font-semibold">General Details</h2>
            <div className="flex flex-col space-y-4">
              <div className="flex">
                <label className="flex flex-col">
                  Name
                  <div className="flex space-x-5">
                    <input
                      ref={projectNameRef}
                      className="w-52 rounded-md bg-gray-700 px-3 py-2 text-pink-50/80"
                      type="text"
                      defaultValue={data.project.name}
                    />
                    <button
                      className="w-28  rounded-md bg-accent-background px-3 py-0.5 text-accent-foreground transition-colors duration-200 ease-in-out"
                      onClick={() => {
                        if (!projectNameRef.current?.value) return;
                        updateProjectName({
                          name: projectNameRef.current?.value,
                          projectId,
                        });
                      }}
                    >
                      Save
                    </button>
                  </div>
                </label>
              </div>
              <p>Current Plan:</p>
              <div className="flex space-x-5">
                <div className="flex w-52 items-center justify-center rounded-md border px-3 py-0.5 text-primary-foreground ">
                  <span>{getProjectPaidPlan(data.project) ?? "Free"}</span>
                </div>
                <button
                  className="rounded-md bg-accent-background px-3 py-0.5 text-accent-foreground transition-colors duration-200 ease-in-out "
                  onClick={async () => {
                    redirectToCheckout(projectId, "STARTUP");
                  }}
                >
                  Upgrade to Startup
                </button>
                <button
                  className="rounded-md bg-accent-background px-3 py-0.5 text-accent-foreground transition-colors duration-200 ease-in-out"
                  onClick={async () => {
                    redirectToCheckout(projectId, "PRO");
                  }}
                >
                  Upgrade to Pro
                </button>
                <Link
                  className="rounded-md border-pink-300 bg-accent-background px-3 py-0.5 text-accent-foreground transition-colors duration-200 ease-in-out"
                  href={`/projects/${projectId}/redeem`}
                >
                  <button className=" my-1">Redeem Coupon</button>
                </Link>
                {data.project.stripeCustomerId != null &&
                  getProjectPaidPlan(data.project) != null && (
                    <button
                      className="text- ml-4 mr-auto mt-4 rounded-sm bg-blue-300 px-3 py-0.5 text-accent-foreground transition-colors duration-200 ease-in-out"
                      onClick={async () => {
                        redirectToBillingPortal(projectId);
                      }}
                    >
                      Manage
                    </button>
                  )}
              </div>
            </div>
          </section>
          <section className="rounded-xl bg-gray-800 px-6 py-3">
            <h2 className="text-xl font-semibold">Members</h2>
            <h3 className="text-sm text-pink-50/80">
              Members have access to this project
            </h3>
            <div className="mt-8 divide-y divide-pink-50/20">
              {data.project.users.map(({ user, role }) => (
                <div key={user.id} className="col flex  py-3">
                  <div className="flex items-center">
                    <span>{user.email}</span>
                    {role !== ROLE.ADMIN && (
                      <IconButton
                        icon={<BsX />}
                        title="Remove User"
                        onClick={() => setUserToRemove(user)}
                        className="bg-transparent text-2xl hover:bg-red-800/80"
                      />
                    )}
                    <span
                      className={clsx(
                        "rounded-md px-2 py-0.5 text-sm capitalize text-pink-50/80",
                        {
                          "  bg-blue-300 text-black": role === ROLE.ADMIN,
                          "bg-blue-300/40 stroke-blue-300 text-blue-300":
                            role === ROLE.USER,
                        }
                      )}
                    >
                      {role.toLowerCase()}
                    </span>
                  </div>
                </div>
              ))}
              <form className="pt-4" onSubmit={onInvite}>
                <label htmlFor="newUserEmail" className=" font-semibold">
                  Invite a new User:
                </label>
                <div className="mt-2 flex space-x-5">
                  <input
                    ref={inviteEmailRef}
                    id="newUserEmail"
                    type="email"
                    className="w-80 max-w-full rounded-md bg-gray-700 px-3 py-2 pr-2 focus:outline-none"
                    placeholder="abby@tryabby.com"
                  />{" "}
                  <button className="w-32 rounded-md bg-accent-background">
                    Invite
                  </button>
                </div>
              </form>
            </div>
          </section>
          <section className="rounded-xl bg-gray-800 px-6 py-3">
            <h2 className="text-xl font-semibold">Usage</h2>
            <h3 className="mb-6 text-sm text-gray-400">
              Current Billing Cycle (
              {dayjs(data.project.currentPeriodEnd)
                .subtract(30, "days")
                .format("MMM DD")}{" "}
              - {dayjs(data.project.currentPeriodEnd).format("MMM DD")})
            </h3>
            <div className="flex flex-col space-y-4">
              <div>
                <h3>A/B Tests:</h3>
                <Progress
                  currentValue={data.project.tests.length}
                  maxValue={limits?.tests ?? Infinity}
                />
                <p className="mt-2">
                  {data.project.tests.length} /{" "}
                  {limits?.tests === Infinity ? "∞" : limits?.tests} A/B Test
                  {data.project.tests.length === 1 ? "" : "s"} used
                </p>
              </div>
              <div>
                <h3>Flags:</h3>
                <Progress
                  currentValue={getFlagCount(data.project.featureFlags ?? [])}
                  maxValue={limits?.flags ?? Infinity}
                />
                <p className="mt-2">
                  {getFlagCount(data.project.featureFlags ?? [])} /{" "}
                  {limits?.flags === Infinity ? "∞" : limits?.flags} Flag
                  {getFlagCount(data.project.featureFlags ?? []) === 1
                    ? ""
                    : "s"}{" "}
                  used
                </p>
              </div>
              <div>
                <h3>Environments:</h3>
                <Progress
                  currentValue={data.project.environments.length}
                  maxValue={limits?.environments ?? Infinity}
                />
                <p className="mt-2">
                  {data.project.environments.length} /{" "}
                  {limits?.environments === Infinity
                    ? "∞"
                    : limits?.environments}{" "}
                  Environment
                  {data.project.environments.length === 1 ? "" : "s"} used
                </p>
              </div>
              <div>
                <h3>Monthly Events:</h3>
                <Progress
                  currentValue={data.project.eventsThisPeriod}
                  maxValue={limits?.eventsPerMonth ?? Infinity}
                />
                <p className="mt-2">
                  {data.project.eventsThisPeriod} /{" "}
                  {limits?.eventsPerMonth === Infinity
                    ? "∞"
                    : limits?.eventsPerMonth}{" "}
                  Events
                </p>
              </div>
            </div>
          </section>
        </>
      )}
      <RemoveUserModal
        isOpen={userToRemove != null}
        onClose={() => setUserToRemove(null)}
        user={userToRemove ?? undefined}
      />
    </main>
  );
};

SettingsPage.getLayout = (page) => <Layout>{page}</Layout>;

export default SettingsPage;
