import { ROLE, type User } from "@prisma/client";
import clsx from "clsx";
import { DashboardButton } from "components/DashboardButton";
import {
  DashboardSection,
  DashboardSectionSubtitle,
  DashboardSectionTitle,
} from "components/DashboardSection";
import { DeleteProjectModal } from "components/DeleteProjectModal";
import { Layout } from "components/Layout";
import { FullPageLoadingSpinner } from "components/LoadingSpinner";
import { Progress } from "components/Progress";
import { RemoveUserModal } from "components/RemoveUserModal";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import dayjs from "dayjs";
import { getFlagCount } from "lib/flags";
import { getProjectPaidPlan, useAbbyStripe } from "lib/stripe";
import { useTracking } from "lib/tracking";
import type { GetStaticPaths, GetStaticProps } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import type { NextPageWithLayout } from "pages/_app";
import { type FormEvent, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { getLimitByPlan } from "server/common/plans";
import { trpc } from "utils/trpc";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import Link from "next/link";

const SETTINGS_TABS = {
  General: "general",
  Team: "team",
  Billing: "billing",
  Danger: "danger",
} as const;

const SettingsPage: NextPageWithLayout = () => {
  const [userToRemove, setUserToRemove] = useState<User | null>(null);
  const [isShowDeleteModal, setisShowDeleteModal] = useState(false);
  const inviteEmailRef = useRef<HTMLInputElement>(null);
  const [currentTab, setCurrentTab] = useQueryState(
    "tab",
    parseAsStringLiteral([
      SETTINGS_TABS.General,
      SETTINGS_TABS.Team,
      SETTINGS_TABS.Billing,
      SETTINGS_TABS.Danger,
    ] as const).withDefault(SETTINGS_TABS.General)
  );
  const router = useRouter();
  const trackEvent = useTracking();

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
        if (!inviteEmailRef.current) return;
        inviteEmailRef.current.value = "";
      })(),
      {
        error: "Failed to send invite",
        loading: "Sending invite...",
        success: "Invite sent",
      }
    );
  };

  const isPlanWithStripe = projectPlan !== null && projectPlan !== "BETA";

  return (
    <main className="space-y-8 text-pink-50 h-full">
      <h1 className="text-3xl font-bold">Project Settings</h1>
      {isLoading || isError ? (
        <FullPageLoadingSpinner />
      ) : (
        <Tabs
          value={currentTab}
          onValueChange={(newTab) =>
            setCurrentTab(
              newTab as (typeof SETTINGS_TABS)[keyof typeof SETTINGS_TABS]
            )
          }
          className="w-full h-full"
        >
          <TabsList>
            {Object.entries(SETTINGS_TABS).map(([key, value]) => (
              <TabsTrigger key={value} value={value}>
                {key}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={SETTINGS_TABS.General}>
            <DashboardSection>
              <DashboardSectionTitle className="mb-8">
                General Details
              </DashboardSectionTitle>
              <div className="flex flex-col space-y-4">
                <div className="flex">
                  <label className="flex flex-col">
                    Name
                    <div className="col flex space-x-5">
                      <Input
                        ref={projectNameRef}
                        className="w-52 px-3 py-2"
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
              </div>
            </DashboardSection>
          </TabsContent>
          <TabsContent value="team">
            <DashboardSection>
              <DashboardSectionTitle>Members</DashboardSectionTitle>
              <DashboardSectionSubtitle>
                Members have access to this project
              </DashboardSectionSubtitle>
              <div className="mt-8 divide-y divide-pink-50/20">
                {data.project.users.map(({ user, role }) => (
                  <div key={user.id} className="py-3">
                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex space-x-2">
                        <span>{user.email}</span>
                        <span
                          className={clsx(
                            "rounded-md px-2 py-0.5 text-sm capitalize",
                            {
                              "bg-green-400 text-black": role === ROLE.ADMIN,
                              "bg-orange-200 text-black": role === ROLE.USER,
                            }
                          )}
                        >
                          {role.toLowerCase()}
                        </span>
                      </div>
                      {role !== ROLE.ADMIN && (
                        <Button
                          variant="link"
                          title="Remove User"
                          onClick={() => setUserToRemove(user)}
                        >
                          Remove User
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <form className="pt-4" onSubmit={onInvite}>
                  <label htmlFor="newUserEmail" className=" font-semibold">
                    Invite a new User:
                  </label>
                  <div className="mt-2 flex space-x-5">
                    <Input
                      ref={inviteEmailRef}
                      id="newUserEmail"
                      type="email"
                      className="w-80 max-w-full"
                      placeholder="abby@tryabby.com"
                    />{" "}
                    <DashboardButton className="px-12">Invite</DashboardButton>
                  </div>
                  <small className="mt-1 text-xs text-gray-400">
                    Note: You can only invite users with an existing account.
                  </small>
                </form>
              </div>
            </DashboardSection>
          </TabsContent>
          <TabsContent value="billing">
            <DashboardSection>
              <DashboardSectionTitle>Usage</DashboardSectionTitle>
              <DashboardSectionSubtitle className="mb-8">
                Current Billing Cycle (
                {dayjs(data.project.currentPeriodEnd)
                  .subtract(30, "days")
                  .format("MMM DD")}{" "}
                - {dayjs(data.project.currentPeriodEnd).format("MMM DD")})
              </DashboardSectionSubtitle>
              <div className="flex flex-col space-y-4">
                <div>
                  <p>Current Plan:</p>
                  <div className="flex flex-col space-y-5">
                    <div className="flex w-52 items-center justify-center rounded-lg border bg-background px-3 py-2">
                      <span>{projectPlan ?? "Free"}</span>
                    </div>
                    <div className="flex space-x-5">
                      <DashboardButton
                        className="px-3 py-2"
                        onClick={async () => {
                          trackEvent("Plan Upgrade Clicked", {
                            props: { Plan: "STARTUP" },
                          });
                          redirectToCheckout(projectId, "STARTUP");
                        }}
                      >
                        Upgrade to Startup
                      </DashboardButton>
                      <DashboardButton
                        className="px-3"
                        onClick={async () => {
                          trackEvent("Plan Upgrade Clicked", {
                            props: { Plan: "PRO" },
                          });
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
                      {data.project.stripeCustomerId !== null &&
                        projectPlan !== null && (
                          <DashboardButton
                            className="px-3"
                            onClick={async () => {
                              redirectToBillingPortal(projectId);
                            }}
                          >
                            Manage
                          </DashboardButton>
                        )}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-1">A/B Tests:</h3>
                  <Progress
                    currentValue={data.project.tests.length}
                    maxValue={limits?.tests ?? Number.POSITIVE_INFINITY}
                  />
                  <p className="mt-2">
                    {data.project.tests.length} /{" "}
                    {limits?.tests === Number.POSITIVE_INFINITY
                      ? "∞"
                      : limits?.tests}{" "}
                    A/B Test
                    {data.project.tests.length === 1 ? "" : "s"} used
                  </p>
                </div>
                <div>
                  <h3 className="mb-1">Flags:</h3>
                  <Progress
                    currentValue={getFlagCount(data.project.featureFlags ?? [])}
                    maxValue={limits?.flags ?? Number.POSITIVE_INFINITY}
                  />
                  <p className="mt-2">
                    {getFlagCount(data.project.featureFlags ?? [])} /{" "}
                    {limits?.flags === Number.POSITIVE_INFINITY
                      ? "∞"
                      : limits?.flags}{" "}
                    Flag
                    {getFlagCount(data.project.featureFlags ?? []) === 1
                      ? ""
                      : "s"}{" "}
                    used
                  </p>
                </div>
                <div>
                  <h3 className="mb-1">Environments:</h3>
                  <Progress
                    currentValue={data.project.environments.length}
                    maxValue={limits?.environments ?? Number.POSITIVE_INFINITY}
                  />
                  <p className="mt-2">
                    {data.project.environments.length} /{" "}
                    {limits?.environments === Number.POSITIVE_INFINITY
                      ? "∞"
                      : limits?.environments}{" "}
                    Environment
                    {data.project.environments.length === 1 ? "" : "s"} used
                  </p>
                </div>
                <div>
                  <h3 className="mb-1">Monthly Events:</h3>
                  <Progress
                    currentValue={data.project.eventsThisPeriod}
                    maxValue={
                      limits?.eventsPerMonth ?? Number.POSITIVE_INFINITY
                    }
                  />
                  <p className="mt-2">
                    {data.project.eventsThisPeriod} /{" "}
                    {limits?.eventsPerMonth === Number.POSITIVE_INFINITY
                      ? "∞"
                      : limits?.eventsPerMonth}{" "}
                    Events
                  </p>
                </div>
              </div>
            </DashboardSection>
          </TabsContent>
          <TabsContent value="danger">
            <DashboardSection>
              <DashboardSectionTitle>Danger Zone</DashboardSectionTitle>
              <DashboardSectionSubtitle className="mb-8">
                Delete this project and all of its data
              </DashboardSectionSubtitle>

              <Button
                onClick={deleteProject}
                disabled={
                  isPlanWithStripe ||
                  !user?.role ||
                  user.role !== ROLE.ADMIN ||
                  session.data?.user?.projectIds === null ||
                  session.data?.user?.projectIds.length === 1
                }
                variant="destructive"
              >
                Delete Project
              </Button>
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
            </DashboardSection>
          </TabsContent>
        </Tabs>
      )}
      <RemoveUserModal
        isOpen={userToRemove !== null}
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

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
};

export default SettingsPage;
