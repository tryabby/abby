import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { DashboardButton } from "components/DashboardButton";
import { Layout } from "components/Layout";
import { FullPageLoadingSpinner } from "components/LoadingSpinner";
import { ArrowLeft } from "lucide-react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { getSSRTrpc } from "server/trpc/helpers";
import { trpc } from "utils/trpc";
import { NextPageWithLayout } from "./_app";
import { Avatar } from "components/Avatar";
import { Input } from "components/Input";
import { z } from "zod";
import { toast } from "react-hot-toast";

const ProfilePage: NextPageWithLayout = () => {
  const trpcContext = trpc.useContext();
  const { data, isLoading } = trpc.user.me.useQuery();

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

  if (isLoading) return <FullPageLoadingSpinner />;

  return (
    <div>
      <DashboardButton
        className="flex py-1 font-medium"
        onClick={() => router.back()}
      >
        <ArrowLeft />
        <span>Go Back</span>
      </DashboardButton>
      <div className="mx-auto mt-12 max-w-xl">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <form onSubmit={onSubmit} className="my-8 space-y-8">
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
              <Input type="text" defaultValue={data?.email ?? ""} disabled />
            </div>
          </div>
          <div>
            You signed up in via{" "}
            <span className="font-medium capitalize underline underline-offset-2">
              {data?.accounts[0]?.provider}
            </span>
          </div>
          <DashboardButton type="submit" className="ml-auto block px-5 py-1">
            Save
          </DashboardButton>
        </form>
      </div>
    </div>
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
