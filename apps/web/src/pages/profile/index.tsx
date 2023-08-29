import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { Avatar } from "components/Avatar";
import { DashboardButton } from "components/DashboardButton";
import {
  DashboardSection,
  DashboardSectionSubtitle,
  DashboardSectionTitle,
} from "components/DashboardSection";
import { IconButton } from "components/IconButton";
import { Input } from "components/Input";
import { Layout } from "components/Layout";
import { FullPageLoadingSpinner } from "components/LoadingSpinner";
import { Modal } from "components/Modal";
import { ArrowLeft } from "lucide-react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { BsX } from "react-icons/bs";
import { getSSRTrpc } from "server/trpc/helpers";
import { trpc } from "utils/trpc";
import { NextPageWithLayout } from "../_app";

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
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Modal
      title={"Your API Key"}
      confirmText="Copy and Close"
      cancelText="Close"
      onConfirm={() => {
        navigator.clipboard.writeText(apiKey);
        onClose();
        toast.success("API Key copied");
      }}
      size="full"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="py-2">
        Ensure you copy your personal access token promptly as you won&apos;t
        have another opportunity to view it.
      </div>
      <Input
        value={apiKey}
        readOnly
        type={isHovered ? "text" : "password"}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="py-3 focus:ring-green-400 dark:focus:ring-green-500"
        onClick={() => {
          navigator.clipboard.writeText(apiKey).then(() => {
            toast.success("API Key copied");
          });
        }}
      />
      <div className="pt-2 text-sm text-gray-500">
        Expires in 365 Days | Hover to reveal
      </div>
    </Modal>
  );
};

const RevokeApiKeyModal = ({
  isOpen,
  onClose,
  apiKey,
}: {
  isOpen: boolean;
  onClose: () => void;
  apiKey?: string;
}) => {
  const trpcContext = trpc.useContext();

  const { mutate: revokeApiKey } = trpc.apikey.revokeApiKey.useMutation({
    onSuccess() {
      toast.success("API Key revoked");

      onClose();
      trpcContext.user.getApiKeyData.invalidate();
    },
  });

  return (
    <Modal
      title={"Revoke API Key"}
      confirmText="Confirm"
      onConfirm={() => {
        if (!apiKey) return;
        revokeApiKey({ id: apiKey });
      }}
      size="full"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div>Wanna really revoke this API Key?</div>
    </Modal>
  );
};

const ProfilePage: NextPageWithLayout = () => {
  const [apiKeyToRevoke, setApiKeyToRevoke] = useState<string | undefined>(
    undefined
  );
  const [isCreateApiKeyModalOpen, setIsCreateApiKeyModalOpen] = useState(false);
  const [isRevokeApiKeyModalOpen, setIsRevokeApiKeyModalOpen] = useState(false);
  const [newApiKeyInfo, setNewApiKeyInfo] = useState<{
    name: string;
    apiKey: string;
  } | null>(null);
  const apiKeyNameRef = useRef<HTMLInputElement>(null);
  const trpcContext = trpc.useContext();
  const { data, isLoading } = trpc.user.me.useQuery();
  const {
    data: apiKeyData,
    isLoading: isAPIKeyDataLoading,
    isError: isAPIKeyDataError,
  } = trpc.user.getApiKeyData.useQuery();

  const updateProfileMutation = trpc.user.updateProfile.useMutation();

  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;

    await updateProfileMutation.mutateAsync({ name });
    trpcContext.user.me.invalidate();

    toast.success("Profile updated successfully");
  };

  const { mutateAsync: createApiKey } = trpc.apikey.createApiKey.useMutation({
    onSuccess() {
      setIsCreateApiKeyModalOpen(true);
      trpcContext.user.getApiKeyData.invalidate();
    },
  });

  if (isLoading) return <FullPageLoadingSpinner />;

  return (
    <>
      <div>
        <DashboardButton
          className="flex py-1 font-medium"
          onClick={() => router.back()}
        >
          <ArrowLeft />
          <span>Go Back</span>
        </DashboardButton>
        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          <DashboardSection>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <form onSubmit={onSubmit} className="mt-8 space-y-8">
              <Avatar
                role="img"
                imageUrl={data?.image ?? ""}
                userName={data?.name ?? data?.email ?? ""}
                className="mx-auto block h-36 w-36"
              />
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Name *
                </label>
                <div className="mt-1">
                  <Input
                    type="text"
                    name="name"
                    id="name"
                    defaultValue={data?.name ?? ""}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Email *
                </label>
                <div className="mt-1">
                  <Input
                    type="text"
                    defaultValue={data?.email ?? ""}
                    disabled
                  />
                </div>
              </div>
              <div>
                You signed up in via{" "}
                <span className="font-medium capitalize underline underline-offset-2">
                  {data?.accounts[0]?.provider}
                </span>
              </div>
              <DashboardButton
                type="submit"
                className="ml-auto block px-5 py-1"
              >
                Save
              </DashboardButton>
            </form>
          </DashboardSection>
          <DashboardSection>
            <DashboardSectionTitle>API Keys</DashboardSectionTitle>
            <DashboardSectionSubtitle>
              API Keys are used to authenticate with the API.
            </DashboardSectionSubtitle>
            <div className="mt-8 divide-y divide-pink-50/20">
              {isAPIKeyDataLoading || isAPIKeyDataError ? (
                <FullPageLoadingSpinner />
              ) : (
                <>
                  {apiKeyData.apiKeys.map(
                    ({ name: apiKeyName, id: apiKeyId }) => (
                      <div
                        key={apiKeyName}
                        className="col flex justify-between py-3"
                      >
                        <div className="flex items-center">{apiKeyName}</div>
                        <IconButton
                          icon={<BsX />}
                          title="Revoke API Key"
                          onClick={() => {
                            setIsRevokeApiKeyModalOpen(true);
                            setApiKeyToRevoke(apiKeyId);
                          }}
                          className="bg-transparent text-2xl hover:bg-red-800/80"
                        />
                      </div>
                    )
                  )}
                </>
              )}

              <form
                className="pt-4"
                onSubmit={(e) => {
                  // TODO: Create API Key
                  e.preventDefault();
                }}
              >
                <label htmlFor="newApiKey" className=" font-semibold">
                  Create a new API Key:
                </label>
                <div className="mt-2">
                  <input
                    ref={apiKeyNameRef}
                    id="newApiKeyName"
                    className="w-80 max-w-full rounded-l-md bg-gray-700 px-3 py-2 pr-2 focus:outline-none"
                    placeholder="API Key name"
                  />{" "}
                  <button
                    onClick={async () => {
                      const name =
                        apiKeyNameRef.current?.value ?? "New Api Key";

                      const apiKey = await createApiKey({
                        name: name,
                      });

                      setNewApiKeyInfo({
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
            </div>
          </DashboardSection>
        </div>
      </div>
      <CreateApiKeyModal
        isOpen={isCreateApiKeyModalOpen}
        apiKey={newApiKeyInfo?.apiKey ?? ""}
        name={newApiKeyInfo?.name ?? ""}
        onClose={() => {
          setIsCreateApiKeyModalOpen(false);
          setNewApiKeyInfo(null);
        }}
      />
      <RevokeApiKeyModal
        isOpen={isRevokeApiKeyModalOpen}
        apiKey={apiKeyToRevoke}
        onClose={() => {
          setIsRevokeApiKeyModalOpen(false);
          setApiKeyToRevoke(undefined);
        }}
      />
    </>
  );
};

ProfilePage.getLayout = (page) => <Layout hideSidebar>{page}</Layout>;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const trpc = await getSSRTrpc(ctx as unknown as CreateNextContextOptions);

  await trpc.user.me.prefetch();

  return {
    props: {
      trpcState: trpc.dehydrate(),
    },
  };
};

export default ProfilePage;
