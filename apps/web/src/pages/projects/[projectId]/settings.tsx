import { ROLE, User } from "@prisma/client";
import clsx from "clsx";
import { Editor } from "components/Editor";
import { IconButton } from "components/IconButton";
import { Input } from "components/Input";
import { Layout } from "components/Layout";
import {
  FullPageLoadingSpinner,
  LoadingSpinner,
} from "components/LoadingSpinner";
import { Modal } from "components/Modal";
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
import { generateRandomString } from "utils/apiKey";
import { trpc } from "utils/trpc";
import { AiOutlinePlus } from "react-icons/ai";
import { trimStart } from "lodash-es";

const CreateApiKeyModal = ({
  isOpen,
  onClose,
  name,
  apiKey,
}: {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  apiKey: string;
}) => {
  return (
    <Modal
      title={name + "// Your API Key"}
      confirmText="Confirm"
      onConfirm={() => {}}
      size="full"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div>Please copy this API Code and so on</div>
      <Input value={apiKey} />
    </Modal>
  );
};

const SettingsPage: NextPageWithLayout = () => {
  const [isCreateApiKeyModalOpen, setIsCreateApiKeyModalOpen] = useState(false);
  const [newApiKeyInfo, setNewApiKeyInfo] = useState<{
    name: string;
    apiKey: string;
  } | null>(null);
  const [userToRemove, setUserToRemove] = useState<User | null>(null);
  const inviteEmailRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const projectId = router.query.projectId as string;
  const projectNameRef = useRef<HTMLInputElement>(null);
  const apiKeyNameRef = useRef<HTMLInputElement>(null);
  const trpcContext = trpc.useContext();
  const { data, isLoading, isError } = trpc.project.getProjectData.useQuery({
    projectId,
  });
  const {
    data: apiKeyData,
    isLoading: isAPIKeyDataLoading,
    isError: isAPIKeyDataError,
  } = trpc.user.getApiKeyData.useQuery();

  // const { data, isLoading, isError } = trpc.user.getApiKeyData.useQuery({});

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

  const { mutate: createApiKey } = trpc.apikey.createApiKey.useMutation({
    onSuccess() {
      setIsCreateApiKeyModalOpen(true);
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
            <h2 className="text-xl font-semibold">Members</h2>
            <h3 className="text-sm text-pink-50/80">
              Members have access to this project
            </h3>
            <div className="mt-8 divide-y divide-pink-50/20">
              {data.project.users.map(({ user, role }) => (
                <div key={user.id} className="col flex justify-between py-3">
                  <div className="flex items-center">
                    <span>{user.email}</span>
                    <span
                      className={clsx(
                        "ml-2 rounded-sm px-2 py-0.5 text-sm capitalize text-pink-50/80",
                        {
                          "bg-orange-300 text-orange-800": role === ROLE.ADMIN,
                          "bg-pink-300 text-pink-800": role === ROLE.USER,
                        }
                      )}
                    >
                      {role.toLowerCase()}
                    </span>
                  </div>
                  {role !== ROLE.ADMIN && (
                    <IconButton
                      icon={<BsX />}
                      title="Remove User"
                      onClick={() => setUserToRemove(user)}
                      className="bg-transparent text-2xl hover:bg-red-800/80"
                    />
                  )}
                </div>
              ))}
              <form className="pt-4" onSubmit={onInvite}>
                <label htmlFor="newUserEmail" className=" font-semibold">
                  Invite a new User:
                </label>
                <div className="mt-2">
                  <input
                    ref={inviteEmailRef}
                    id="newUserEmail"
                    type="email"
                    className="w-80 max-w-full rounded-l-md bg-gray-700 px-3 py-2 pr-2 focus:outline-none"
                    placeholder="abby@tryabby.com"
                  />{" "}
                  <button className="-ml-1 mt-2 rounded-l-md rounded-r-md bg-gray-900 px-3 py-2 md:mt-0 md:rounded-l-none">
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
          <section className="rounded-xl bg-gray-800 px-6 py-3">
            <h2 className="mb-8 text-xl font-semibold">Project</h2>
            <div className="flex flex-col space-y-4">
              <div>
                <p>
                  Current Plan: {getProjectPaidPlan(data.project) ?? "Free"}{" "}
                </p>
                <div className="flex space-x-3">
                  <button
                    className="mt-4 rounded-sm bg-blue-300 px-3 py-0.5 text-gray-800 transition-colors duration-200 ease-in-out hover:bg-blue-400"
                    onClick={async () => {
                      redirectToCheckout(projectId, "STARTUP");
                    }}
                  >
                    Upgrade to Startup
                  </button>
                  <button
                    className="mt-4 rounded-sm bg-blue-300 px-3 py-0.5 text-gray-800 transition-colors duration-200 ease-in-out hover:bg-blue-400"
                    onClick={async () => {
                      redirectToCheckout(projectId, "PRO");
                    }}
                  >
                    Upgrade to Pro
                  </button>
                  <Link href={`/projects/${projectId}/redeem`}>
                    <button className="mt-4 rounded-sm px-3 py-0.5 text-white transition-all duration-200 ease-in-out hover:underline">
                      Redeem Coupon
                    </button>
                  </Link>
                </div>
                {data.project.stripeCustomerId != null &&
                  getProjectPaidPlan(data.project) != null && (
                    <button
                      className="ml-4 mr-auto mt-4 rounded-sm bg-blue-300 px-3 py-0.5 text-gray-800 transition-colors duration-200 ease-in-out hover:bg-blue-400"
                      onClick={async () => {
                        redirectToBillingPortal(projectId);
                      }}
                    >
                      Manage
                    </button>
                  )}
              </div>
              <label>
                Name
                <input
                  ref={projectNameRef}
                  className="mt-2 w-full rounded-md bg-gray-700 px-3 py-2 text-pink-50/80"
                  type="text"
                  defaultValue={data.project.name}
                />
              </label>
              <button
                className="mr-auto mt-4 rounded-sm bg-blue-300 px-3 py-0.5 text-gray-800 transition-colors duration-200 ease-in-out hover:bg-blue-400"
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
          </section>
          <section className="rounded-xl bg-gray-800 px-6 py-3">
            <h2 className="text-xl font-semibold">API Keys</h2>
            <h3 className="text-sm text-pink-50/80">
              API Keys are used to authenticate with the API.
            </h3>
            {isAPIKeyDataLoading || isAPIKeyDataError ? (
              <FullPageLoadingSpinner />
            ) : (
              <>
                {apiKeyData.apiKeys.map(({ name: apiKeyName }) => (
                  <div>{apiKeyName}</div>
                ))}
              </>
            )}

            <form className="pt-4" onSubmit={onInvite}>
              <label htmlFor="newUserEmail" className=" font-semibold">
                Create a new API Key:
              </label>
              <div className="mt-2">
                <input
                  ref={apiKeyNameRef}
                  id="newApiKeyName"
                  className="w-80 max-w-full rounded-l-md bg-gray-700 px-3 py-2 pr-2 focus:outline-none"
                  placeholder="Application name"
                />{" "}
                <button
                  onClick={() => {
                    const apiKey = generateRandomString(32);
                    const name = apiKeyNameRef.current?.value ?? "New Api Key";
                    setNewApiKeyInfo({
                      name: name,
                      apiKey: apiKey,
                    });
                    createApiKey({
                      name: name,
                      apiKey: apiKey,
                    });
                  }}
                  className="-ml-1 mt-2 rounded-l-md rounded-r-md bg-gray-900 px-3 py-2 md:mt-0 md:rounded-l-none"
                >
                  Create
                </button>
              </div>
            </form>

            {/* <div className="flex space-x-3">
              <button
                className="mr-auto mt-4 rounded-sm bg-blue-300 px-3 py-0.5 text-gray-800 transition-colors duration-200 ease-in-out hover:bg-blue-400"
                onClick={() => {
                  if (apiKeyRef.current) {
                    const apiKey = generateRandomString(32);
                    apiKeyRef.current.textContent =
                      apiKey +
                      "\n Please copy and save the API Key. The API Key cant be displayed again. So please save it. It is better for you.";
                    apiKeyRef.current.classList.toggle("invisible");
                    const hashedApiKey = hashApiKey(apiKey);
                    // createApiKey({
                    //   apiKey: hashedApiKey,
                    // });
                  }
                }}
              >
                Generate
              </button>
            </div> */}
          </section>
        </>
      )}
      <RemoveUserModal
        isOpen={userToRemove != null}
        onClose={() => setUserToRemove(null)}
        user={userToRemove ?? undefined}
      />
      <CreateApiKeyModal
        isOpen={isCreateApiKeyModalOpen}
        apiKey={newApiKeyInfo?.apiKey ?? ""}
        name={newApiKeyInfo?.name ?? ""}
        onClose={() => {
          setIsCreateApiKeyModalOpen(false);
          setNewApiKeyInfo(null);
        }}
      />
    </main>
  );
};

SettingsPage.getLayout = (page) => <Layout>{page}</Layout>;

export default SettingsPage;
