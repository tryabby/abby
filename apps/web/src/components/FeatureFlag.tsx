import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import dayjs from "dayjs";
import { FaHistory } from "react-icons/fa";
import { P, match } from "ts-pattern";

import type { FeatureFlagHistory, FeatureFlagType } from "@prisma/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "components/Tooltip";
import relativeTime from "dayjs/plugin/relativeTime";
import { cn } from "lib/utils";
import { Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { type RouterOutputs, trpc } from "utils/trpc";
import { ChangeFlagForm, type FlagFormValues } from "./AddFeatureFlagModal";
import { Avatar } from "./Avatar";
import { LoadingSpinner } from "./LoadingSpinner";
import { Modal } from "./Modal";

dayjs.extend(relativeTime);

const getHistoryEventDescription = (event: FeatureFlagHistory) => {
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

const HistoryButton = ({ flagValueId }: { flagValueId: string }) => {
  const {
    data,
    isLoading,
    refetch: loadHistory,
  } = trpc.flags.getHistory.useQuery({ flagValueId }, { enabled: false });
  return (
    <Tooltip>
      <TooltipContent>
        <span>Show History</span>
      </TooltipContent>
      <Popover>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => loadHistory()}
              className="focus:outline-none focus:ring-0"
            >
              <FaHistory />
            </button>
          </TooltipTrigger>
        </PopoverTrigger>

        <PopoverContent
          className="w-full max-w-xl select-none text-sm"
          sideOffset={5}
        >
          {isLoading && <LoadingSpinner />}
          {data !== undefined && (
            <>
              <p className="text-xs">Edited {data.length} times</p>
              <hr className="-mx-2 my-1 border-gray-700" />
              <div className="max-h-48 space-y-4 overflow-y-auto py-2">
                {data.map((history) => (
                  <div key={history.id} className="flex items-center space-x-3">
                    <div>
                      <Avatar
                        userName={
                          history.user.name ?? history.user.email ?? undefined
                        }
                        imageUrl={history.user.image ?? undefined}
                        className="h-5 w-5 rounded-lg text-[10px]"
                      />
                    </div>
                    <span>
                      {history.user.name ?? history.user.email}{" "}
                      {getHistoryEventDescription(history)} this flag{" "}
                      {dayjs(history.createdAt).fromNow()}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </Tooltip>
  );
};

const ConfirmUpdateModal = ({
  isOpen,
  onClose,
  currentValue,
  description,
  projectId,
  flagName,
  type,
  flagValueId,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentValue: string;
  type: FeatureFlagType;
  description: string;
  projectId: string;
  flagName: string;
  flagValueId: string;
}) => {
  const [state, setState] = useState<FlagFormValues>({
    name: flagName,
    value: currentValue,
    type,
  });
  const trpcContext = trpc.useContext();

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
      size="full"
    >
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
      <h3 className="mt-8 text-sm font-semibold">Description:</h3>
      {!description ? (
        "No description provided"
      ) : (
        // biome-ignore lint/security/noDangerouslySetInnerHtml:>
        <p dangerouslySetInnerHTML={{ __html: description }} />
      )}
    </Modal>
  );
};

type Props = {
  flag: RouterOutputs["flags"]["getFlags"]["flags"][number];
  projectId: string;
  environmentName: string;
  flagValueId: string;
  type: FeatureFlagType;
};

export function FeatureFlag({
  flag,
  projectId,
  environmentName,
  flagValueId,
  type,
}: Props) {
  const [isUpdateConfirmationModalOpen, setIsUpdateConfirmationModalOpen] =
    useState(false);

  const currentFlagValue = flag.values.find((f) => f.id === flagValueId)?.value;

  if (currentFlagValue == null) {
    return null;
  }

  return (
    <>
      <span className="flex w-full items-center justify-between space-x-3 rounded-lg bg-card py-3 pl-3 pr-4 text-sm font-medium text-gray-300">
        <div className="flex items-center space-x-2">
          <p>{environmentName}</p>
          <code
            title={currentFlagValue}
            className={cn(
              "max-w-[60px] overflow-hidden text-ellipsis whitespace-nowrap rounded-lg bg-accent p-1",
              type === "BOOLEAN" && currentFlagValue === "true"
                ? "text-green-500"
                : "text-red-500"
            )}
          >
            {typeof currentFlagValue === "string" &&
            currentFlagValue.trim() === ""
              ? "Empty String"
              : currentFlagValue}
          </code>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setIsUpdateConfirmationModalOpen(true)}
          >
            <Edit size={18} />
          </button>
          <HistoryButton flagValueId={flagValueId} />
        </div>
      </span>

      <ConfirmUpdateModal
        isOpen={isUpdateConfirmationModalOpen}
        onClose={() => setIsUpdateConfirmationModalOpen(false)}
        flagValueId={flagValueId}
        description={flag.description ?? ""}
        projectId={projectId}
        flagName={flag.name}
        type={flag.type}
        currentValue={currentFlagValue}
      />
    </>
  );
}
