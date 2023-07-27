import { ROLE, User } from "@prisma/client";
import clsx from "clsx";
import { IconButton } from "components/IconButton";
import { Layout } from "components/Layout";
import { FullPageLoadingSpinner } from "components/LoadingSpinner";
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
import { DeleteProjectModal } from "components/DeleteProjectModal";
import { useSession } from "next-auth/react";
import { DashboardButton } from "components/DashboardButton";

const SettingsPage: NextPageWithLayout = () => {
  const [userToRemove, setUserToRemove] = useState<User | null>(null);
  const [isShowDeleteModal, setisShowDeleteModal] = useState(false);
  const inviteEmailRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const projectId = router.query.projectId as string;
  const projectNameRef = useRef<HTMLInputElement>(null);
  const trpcContext = trpc.useContext();
  const { data, isLoading, isError } = trpc.project.getProjectData.useQuery({
    projectId,
  });
  const session = useSession();

  const user = data?.project.users.find(
    (projectUser) => projectUser.user.id === session.data?.user?.id
  );

  const projectPlan = data ? getProjectPaidPlan(data.project) : null;

  const limits = data ? getLimitByPlan(projectPlan) : null;

  const { mutate: updateProjectName } = trpc.project.updateName.useMutation({
    onSuccess() {
      toast.success("Project name updated");
      trpcContext.project.getProjectData.invalidate();
      trpcContext.user.getProjects.invalidate();
    },
  });

  const { mutateAsync } = trpc.invite.createInvite.useMutation();

  const { redirectToCheckout, redirectToBillingPortal } = useAbbyStripe();

  const deleteProject = async () => {
    if (!projectId) return;
    setisShowDeleteModal(true);
  };

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

  const isPlanWithStripe = projectPlan != null && projectPlan != "BETA";

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
                  <div className="col flex space-x-5">
                    <input
                      ref={projectNameRef}
                      className="w-52 rounded-md bg-gray-700 px-3 py-2 text-pink-50/80"
                      type="text"
                      defaultValue={data.project.name}
                    />
                    <DashboardButton
                      className="px-12"
                      onClick={() => {
                        if (!projectNameRef.current?.value) return;
                        updateProjectName({
                          name: projectNameRef.current?.value,
                          projectId,
                        });
                      }}
                    >
                      Save
                    </DashboardButton>
                  </div>
                </label>
              </div>
              <p>Current Plan:</p>
              <div className="my-2 flex space-x-5">
                <div className="flex w-52 items-center justify-center rounded-md border px-3 py-0.5 text-primary-foreground ">
                  <span>{projectPlan ?? "Free"}</span>
                </div>
                <DashboardButton
                  className="px-3 py-2"
                  onClick={async () => {
                    redirectToCheckout(projectId, "STARTUP");
                  }}
                >
                  Upgrade to Startup
                </DashboardButton>
                <DashboardButton
                  className="px-3"
                  onClick={async () => {
                    redirectToCheckout(projectId, "PRO");
                  }}
                >
                  Upgrade to Pro
                </DashboardButton>
                <Link href={`/projects/${projectId}/redeem`}>
                  <DashboardButton className="px-3 py-2">
                    Redeem Coupon
                  </DashboardButton>
                </Link>
                {data.project.stripeCustomerId != null &&
                  projectPlan != null && (
                    <button
                      className="text- ml-4 mr-auto mt-4 rounded-sm bg-blue-300 px-3"
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
                  <div className="flex items-center space-x-2">
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
                        "capitaliz rounded-md px-2 py-0.5 text-sm capitalize",
                        {
                          "bg-blue-300 text-black": role === ROLE.ADMIN,
                          "bg-blue-300/40 text-black": role === ROLE.USER,
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
                  <DashboardButton className="px-12">Invite</DashboardButton>
                </div>
                <small className="mt-1 text-xs text-gray-400">
                  Note: You can only invite users with an existing account.
                </small>
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
          <section className="rounded-xl bg-gray-800 px-6 py-3">
            <h2 className="text-xl font-semibold">Danger Zone</h2>
            <h3 className="mb-8 text-sm text-pink-50/80">
              Delete this project and all of its data
            </h3>

            <DashboardButton
              onClick={deleteProject}
              disabled={
                isPlanWithStripe ||
                !user?.role ||
                user.role !== ROLE.ADMIN ||
                session.data?.user?.projectIds == null ||
                session.data?.user?.projectIds.length === 1
              }
              className="bg-red-600 py-2 font-medium hover:bg-red-600"
            >
              Delete Project
            </DashboardButton>
            {isPlanWithStripe && (
              <p className="mt-2 text-sm text-gray-400">
                You must downgrade to the free plan before deleting this
                project.
              </p>
            )}
            {session.data?.user?.projectIds.length === 1 && (
              <p className="mt-2 text-sm text-gray-400">
                You must create a new project before deleting this project.
              </p>
            )}
          </section>
        </>
      )}
      <RemoveUserModal
        isOpen={userToRemove != null}
        onClose={() => setUserToRemove(null)}
        user={userToRemove ?? undefined}
      />
      <DeleteProjectModal
        isOpen={isShowDeleteModal}
        onClose={() => setisShowDeleteModal(false)}
      />
    </main>
  );
};

SettingsPage.getLayout = (page) => <Layout>{page}</Layout>;

export default SettingsPage;
