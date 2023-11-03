import { DashboardHeader } from "components/DashboardHeader";
import { Layout } from "components/Layout";
import { FullPageLoadingSpinner } from "components/LoadingSpinner";
import { useProjectId } from "lib/hooks/useProjectId";
import { NextPageWithLayout } from "pages/_app";
import { trpc } from "utils/trpc";

import { FeatureFlagPageContent } from "components/FlagPage";
import { GetStaticPaths, GetStaticProps } from "next";

const FeatureFlagsPage: NextPageWithLayout = () => {
  const projectId = useProjectId();

  const { data, isLoading, isError } = trpc.flags.getFlags.useQuery(
    {
      projectId,
      types: ["BOOLEAN"],
    },
    {
      enabled: !!projectId,
    }
  );

  if (isLoading || isError) return <FullPageLoadingSpinner />;

  return <FeatureFlagPageContent data={data} type="Flags" />;
};

FeatureFlagsPage.getLayout = (page) => (
  <Layout>
    <DashboardHeader title="Feature Flags" />
    {page}
  </Layout>
);

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

export default FeatureFlagsPage;
