import * as Popover from "@radix-ui/react-popover";
import dayjs from "dayjs";
import { FaHistory } from "react-icons/fa";
import { match, P } from "ts-pattern";

import { FeatureFlagHistory } from "@prisma/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "components/Tooltip";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { RouterOutputs, trpc } from "utils/trpc";
import { Avatar } from "./Avatar";
import { LoadingSpinner } from "./LoadingSpinner";
import { Modal } from "./Modal";
import { Edit } from "lucide-react";

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
  flagValueId,
  description,
  projectId,
  flagName,
}: {
  isOpen: boolean;
  onClose: () => void;
  flagValueId: string;
  description: string;
  projectId: string;
  flagName: string;
}) => {
  const [newValue, setNewValue] = useState("");
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
      title="Confirm Toggle"
      confirmText={`Update Flag`}
      onConfirm={() => updateFlag({ value: newValue, flagValueId })}
      isOpen={isOpen}
      onClose={onClose}
    >
      <h2>
        Are you sure that you want to update the flag <i>{flagName}</i>?
      </h2>
      <h3 className="mt-4 text-sm font-semibold">Description:</h3>
      <p dangerouslySetInnerHTML={{ __html: description }} />
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
      <span className="mr-2 flex w-full items-center justify-between space-x-3 rounded-xl bg-gray-100 py-3 pl-3 pr-4 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        <div className="flex items-center space-x-2">
          <p>{environmentName}</p>
          <code className="max-w-[60px] overflow-hidden text-ellipsis rounded-md bg-gray-600 p-1">
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
      />
    </>
  );
}
