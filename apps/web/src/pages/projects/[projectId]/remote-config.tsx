import { DashboardHeader } from "components/DashboardHeader";
import { Layout } from "components/Layout";
import { FullPageLoadingSpinner } from "components/LoadingSpinner";
import { useProjectId } from "lib/hooks/useProjectId";
import { NextPageWithLayout } from "pages/_app";
import { trpc } from "utils/trpc";

import { FeatureFlagPageContent } from "components/FlagPage";

const RemoteConfigPage: NextPageWithLayout = () => {
  const projectId = useProjectId();

  const { data, isLoading, isError } = trpc.flags.getFlags.useQuery({
    projectId,
    types: ["JSON", "STRING", "NUMBER"],
  });

  if (isLoading || isError) return <FullPageLoadingSpinner />;

  return <FeatureFlagPageContent data={data} type="Remote Config" />;
};

RemoteConfigPage.getLayout = (page) => (
  <Layout>
    <DashboardHeader title="Remote Config" />
    {page}
  </Layout>
);

export default RemoteConfigPage;
