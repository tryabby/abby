import * as Popover from "@radix-ui/react-popover";
import dayjs from "dayjs";
import { FaHistory } from "react-icons/fa";
import { match, P } from "ts-pattern";

import { FeatureFlagHistory, FeatureFlagType } from "@prisma/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "components/Tooltip";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { RouterOutputs, trpc } from "utils/trpc";
import { Avatar } from "./Avatar";
import { LoadingSpinner } from "./LoadingSpinner";
import { Modal } from "./Modal";
import { Edit } from "lucide-react";
import { ChangeFlagForm, FlagFormValues } from "./AddFeatureFlagModal";

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
      <Popover.Root>
        <Popover.Trigger asChild>
          <TooltipTrigger asChild>
            <button
              onClick={() => loadHistory()}
              className="focus:outline-none focus:ring-0"
            >
              <FaHistory />
            </button>
          </TooltipTrigger>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="max-w-lg select-none rounded-[4px] bg-gray-800 px-[15px] py-[10px] text-[15px] leading-none text-pink-50 shadow-md will-change-[transform,opacity] focus:shadow-md data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=top]:animate-slideDownAndFade"
            sideOffset={5}
          >
            {isLoading && <LoadingSpinner />}
            {data != null && (
              <>
                <p className="text-xs">Edited {data.length} times</p>
                <hr className="-mx-2 my-1 border-gray-700" />
                <div className="space-y-4">
                  {data.map((history) => (
                    <div
                      key={history.id}
                      className="flex items-center space-x-3 "
                    >
                      <Avatar
                        userName={
                          history.user.name ?? history.user.email ?? undefined
                        }
                        imageUrl={history.user.image ?? undefined}
                        className="h-5 w-5 rounded-md text-[10px]"
                      />
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
            <Popover.Arrow className="fill-gray-800" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
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
      trpcContext.flags.getFlags.setData({ projectId }, (prev) => {
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
      toast.error("Failed to toggle flag");
    },
  });

  return (
    <Modal
      title="Update Flag"
      confirmText={`Update Flag`}
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
      />
      <h3 className="mt-8 text-sm font-semibold">Description:</h3>
      {!description ? (
        "No description provided"
      ) : (
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
};

export function FeatureFlag({
  flag,
  projectId,
  environmentName,
  flagValueId,
}: Props) {
  const [isUpdateConfirmationModalOpen, setIsUpdateConfirmationModalOpen] =
    useState(false);

  const currentFlagValue = flag.values.find((f) => f.id === flagValueId)?.value;

  if (!currentFlagValue) {
    return null;
  }

  return (
    <>
      <span className="flex w-full items-center justify-between space-x-3 rounded-xl bg-gray-100 py-3 pl-3 pr-4 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        <div className="flex items-center space-x-2">
          <p>{environmentName}</p>
          <code
            title={currentFlagValue}
            className="max-w-[60px] overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-gray-600 p-1"
          >
            {currentFlagValue}
          </code>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setIsUpdateConfirmationModalOpen(true)}>
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
