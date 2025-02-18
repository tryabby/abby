import type { ValidatorType } from "@tryabby/core";
import type { FlagRuleSet } from "@tryabby/core/schema";
import { Avatar } from "components/Avatar";
import { DashboardHeader } from "components/DashboardHeader";
import { getHistoryEventDescription } from "components/FeatureFlag";
import { Layout } from "components/Layout";
import { FlagRulesEditor } from "components/flags/RuleSetEditor";
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Label } from "components/ui/label";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { getEnvironmentStyle } from "lib/environment-styles";
import { cn } from "lib/utils";
import { AlertCircle, Plus } from "lucide-react";
import { useRouter } from "next/router";
import type { NextPageWithLayout } from "pages/_app";
import toast from "react-hot-toast";
import { trpc } from "utils/trpc";

dayjs.extend(relativeTime);

const FlagDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const flagId = router.query.flagId as string;
  const flagQuery = trpc.flags.getFlagByValueId.useQuery({
    flagValueId: flagId,
  });
  const updateFlagMutation = trpc.flags.updateFlagRuleSet.useMutation({
    onSuccess: () => {
      toast.success("Flag rules updated");
    },
    onError: () => {
      toast.error("Could not save flag rules");
    },
  });
  if (flagQuery.isLoading) {
    return <div>Loading...</div>;
  }
  if (flagQuery.error || !flagQuery.data) {
    return <div>Error...</div>;
  }
  const userSchema = flagQuery.data.flag.project.userSegments[0]?.schema;
  return (
    <div className="space-y-8">
      <DashboardHeader title={flagQuery.data.flag.name} />
      <div className="flex items-center gap-2 mt-2">
        <span className="text-muted-foreground">Environment:</span>
        {(() => {
          const style = getEnvironmentStyle(flagQuery.data.environment.name);
          return (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-md",
                style.bg,
                style.border
              )}
            >
              <div className={cn("h-2 w-2 rounded-full", style.icon)} />
              <span className={cn("text-sm font-medium", style.text)}>
                {flagQuery.data.environment.name}
              </span>
            </div>
          );
        })()}
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Value Configuration</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-6">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Default Value
                </Label>
                <div className="flex items-center gap-2">
                  <code className="text-sm px-3 py-1.5 bg-muted rounded-md">
                    {flagQuery.data.value}
                  </code>
                  <span className="text-xs text-muted-foreground">
                    Type: {flagQuery.data.flag.type.toLowerCase()}
                  </span>
                </div>
              </div>

              {flagQuery.data.flag.description && (
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Description
                  </Label>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                      dangerouslySetInnerHTML={{
                        __html: flagQuery.data.flag.description,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {userSchema ? (
          <FlagRulesEditor
            userSchema={userSchema as Record<string, ValidatorType>}
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
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-3 rounded-full bg-muted/50">
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">No User Definitions Available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You need to set up user definitions first to create custom
                    rules for this flag.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User Definition
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>History</span>
                <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  {flagQuery.data.history.length}{" "}
                  {flagQuery.data.history.length === 1 ? "change" : "changes"}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {flagQuery.data.history.map((history) => (
                <div
                  key={history.id}
                  className="flex items-start space-x-3 py-2 border-b border-border last:border-0"
                >
                  <Avatar
                    userName={
                      history.user.name ?? history.user.email ?? undefined
                    }
                    imageUrl={history.user.image ?? undefined}
                    className="h-8 w-8 rounded-full shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">
                        {history.user.name ?? history.user.email}
                      </span>{" "}
                      {getHistoryEventDescription(history)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dayjs(history.createdAt).fromNow()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

FlagDetailPage.getLayout = (page) => <Layout>{page}</Layout>;

export default FlagDetailPage;
