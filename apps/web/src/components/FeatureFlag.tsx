import {} from "components/ui/popover";
import dayjs from "dayjs";
import { P, match } from "ts-pattern";

import type { FeatureFlagHistory, FeatureFlagType } from "@prisma/client";
import {} from "components/Tooltip";
import { Button } from "components/ui/button";
import { Label } from "components/ui/label";
import relativeTime from "dayjs/plugin/relativeTime";
import { getEnvironmentStyle } from "lib/environment-styles";
import { cn } from "lib/utils";
import { Pencil, Settings } from "lucide-react";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { type RouterOutputs, trpc } from "utils/trpc";
import { ChangeFlagForm, type FlagFormValues } from "./AddFeatureFlagModal";
import { Modal } from "./Modal";

dayjs.extend(relativeTime);

export const getHistoryEventDescription = (event: FeatureFlagHistory) => {
  return match(event)
    .with(
      {
        newValue: P.not(P.nullish),
        oldValue: null,
      },
      () => "created" as const
    )
    .with(
      {
        newValue: P.not(P.nullish),
        oldValue: P.not(P.nullish),
      },
      () => "updated" as const
    )
    .run();
};

const ConfirmUpdateModal = ({
  isOpen,
  onClose,
  currentValue,
  type,
  description,
  projectId,
  flagName,
  flagValueId,
  environmentName,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentValue: string;
  type: FeatureFlagType;
  description: string;
  projectId: string;
  flagName: string;
  flagValueId: string;
  environmentName: string;
}) => {
  const [state, setState] = useState<FlagFormValues>({
    name: flagName,
    value: currentValue,
    type,
  });
  const trpcContext = trpc.useContext();
  const envStyle = getEnvironmentStyle(environmentName);

  const { mutate: updateFlag } = trpc.flags.updateFlag.useMutation({
    onSuccess(_, { value, flagValueId }) {
      trpcContext.flags.getFlags.setData({ projectId, types: [] }, (prev) => {
        if (!prev) return prev;

        const flagToUpdate = prev.flags.find((flag) =>
          flag.values.some((value) => value.id === flagValueId)
        );
        if (!flagToUpdate) return;

        const valueToUpdate = flagToUpdate.values.find(
          (value) => value.id === flagValueId
        );
        if (!valueToUpdate) return;

        valueToUpdate.value = value.toString();
        return prev;
      });

      trpcContext.flags.getFlags.invalidate({ projectId });
      onClose();
    },
    onError() {
      toast.error(`Failed to update ${type === "BOOLEAN" ? "flag" : "value"}`);
    },
  });

  return (
    <Modal
      title={`Update ${type === "BOOLEAN" ? "flag" : "value"}`}
      confirmText={`Update ${type === "BOOLEAN" ? "flag" : "value"}`}
      onConfirm={() => updateFlag({ ...state, flagValueId })}
      isOpen={isOpen}
      onClose={onClose}
      size="base"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", envStyle.icon)} />
          <span className={cn("text-sm font-medium", envStyle.text)}>
            {environmentName}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Current Value</Label>
            <code
              className={cn(
                "mt-1.5 block w-full px-3 py-2 rounded-md font-mono text-sm",
                envStyle.bg,
                envStyle.text
              )}
            >
              {currentValue}
            </code>
          </div>

          <div>
            <Label>New Value</Label>
            <ChangeFlagForm
              key={flagValueId}
              initialValues={{
                name: flagName,
                value: currentValue,
                type,
              }}
              onChange={(newState) => setState(newState)}
              errors={{}}
              canChangeType={false}
              isRemoteConfig={type !== "BOOLEAN"}
            />
          </div>

          {description && (
            <div className="pt-6 mt-6 border-t border-border">
              <Label className="block mb-2 text-sm text-muted-foreground">
                Description
              </Label>
              <div
                className="prose-sm prose dark:prose-invert"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export const FeatureFlag = ({
  flag,
  projectId,
  environmentName,
  flagValueId,
  type,
  minimal = false,
}: {
  flag: RouterOutputs["flags"]["getFlags"]["flags"][number];
  projectId: string;
  environmentName: string;
  flagValueId: string;
  type: FeatureFlagType;
  minimal?: boolean;
}) => {
  const router = useRouter();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const flagValue = useMemo(() => {
    return flag.values.find((value) => value.id === flagValueId)?.value;
  }, [flag.values, flagValueId]);

  const envStyle = getEnvironmentStyle(environmentName);

  const getJSONPreview = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object") {
        if (Array.isArray(parsed)) {
          return `[${parsed.length} items]`;
        }
        const keys = Object.keys(parsed);
        if (keys.length === 0) return "{ }";
        return `{ ${keys[0]}: ..., ${keys.length > 1 ? `+${keys.length - 1} more` : ""} }`;
      }
      return value;
    } catch {
      return value;
    }
  };

  return (
    <>
      <div
        className={cn(
          "relative rounded-lg transition-all duration-200",
          minimal ? "" : "w-full",
          envStyle.border,
          envStyle.bg
        )}
      >
        {!minimal && (
          <Button
            variant="ghost"
            className="absolute right-2 top-2"
            size="sm"
            onClick={() =>
              router.push(`/projects/${projectId}/flags/${flagValueId}`)
            }
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
        <div className={cn("space-y-4 p-4", minimal ? "" : "pr-12")}>
          <div className="space-y-3">
            {match(type)
              .with("BOOLEAN", () => (
                <div className="flex items-center justify-between space-x-2">
                  <Button
                    variant="outline"
                    className="justify-between flex-1 group"
                    onClick={() => setIsUpdateModalOpen(true)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm", envStyle.text)}>
                        Current value:
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          flagValue === "true"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {flagValue === "true" ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
              .with("NUMBER", () => (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="justify-between w-full group"
                    onClick={() => setIsUpdateModalOpen(true)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm", envStyle.text)}>
                        Current value:
                      </span>
                      <code
                        className={cn(
                          "px-2 py-1 rounded font-mono",
                          envStyle.bg,
                          envStyle.text
                        )}
                      >
                        {flagValue}
                      </code>
                    </div>
                    <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </div>
              ))
              .with("STRING", () => (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="justify-between w-full group"
                    onClick={() => setIsUpdateModalOpen(true)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm", envStyle.text)}>
                        Current value:
                      </span>
                      <code
                        className={cn(
                          "px-2 py-1 rounded font-mono max-w-[150px] truncate",
                          envStyle.bg,
                          envStyle.text
                        )}
                      >
                        {flagValue || ""}
                      </code>
                    </div>
                    <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </div>
              ))
              .with("JSON", () => (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="items-center justify-between w-full group"
                    onClick={() => setIsUpdateModalOpen(true)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm", envStyle.text)}>
                        Current value:
                      </span>
                      <code
                        className={cn(
                          "px-2 py-1 rounded font-mono text-xs",
                          envStyle.bg,
                          envStyle.text
                        )}
                      >
                        {getJSONPreview(flagValue || "")}
                      </code>
                    </div>
                    <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </div>
              ))
              .exhaustive()}
          </div>
        </div>
      </div>

      <ConfirmUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        currentValue={flagValue ?? ""}
        type={type}
        description={flag.description ?? ""}
        projectId={projectId}
        flagName={flag.name}
        flagValueId={flagValueId}
        environmentName={environmentName}
      />
    </>
  );
};
