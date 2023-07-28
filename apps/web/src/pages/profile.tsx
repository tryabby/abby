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

const ProfilePage: NextPageWithLayout = () => {
  const { data, isLoading } = trpc.user.me.useQuery();

  const router = useRouter();

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
      <h1>Profile</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
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
