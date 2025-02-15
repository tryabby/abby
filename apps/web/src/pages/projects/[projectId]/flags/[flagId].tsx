import type { ValidatorType } from "@tryabby/core";
import { DashboardHeader } from "components/DashboardHeader";
import { FlagRulesEditor } from "components/flags/RuleSetEditor";
import { Layout } from "components/Layout";
import type { FlagRuleSet } from "lib/flagRules";
import { useRouter } from "next/router";
import type { NextPageWithLayout } from "pages/_app";
import { trpc } from "utils/trpc";

const FlagDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const flagId = router.query.flagId as string;
  const flagQuery = trpc.flags.getFlagByValueId.useQuery({
    flagValueId: flagId,
  });
  const updateFlagMutation = trpc.flags.updateFlagRuleSet.useMutation();
  if (flagQuery.isLoading) {
    return <div>Loading...</div>;
  }
  if (flagQuery.error || !flagQuery.data) {
    return <div>Error...</div>;
  }
  const userSchema = flagQuery.data.flag.project.userSegments[0]?.schema;
  return (
    <div>
      {userSchema ? (
        <FlagRulesEditor
          userSchema={userSchema as Record<string, ValidatorType>}
          flagName={flagQuery.data.flag.name}
          flagValue={flagQuery.data.value}
          flagType={flagQuery.data.flag.type}
          onSave={(ruleSet) => {
            updateFlagMutation.mutate({
              flagValueId: flagId,
              ruleSet,
              ruleSetId: flagQuery.data?.ruleSets[0]?.id,
            });
          }}
          initialData={flagQuery.data.ruleSets[0]?.rules as FlagRuleSet}
        />
      ) : (
        <p>
          You don't have any user definitions set up yet. Please create one
          first in order to define custom rules for this flag
        </p>
      )}
    </div>
  );
};

FlagDetailPage.getLayout = (page) => (
  <Layout>
    <DashboardHeader title="Feature Flags" />
    {page}
  </Layout>
);

export default FlagDetailPage;
