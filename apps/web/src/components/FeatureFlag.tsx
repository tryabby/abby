import * as Popover from "@radix-ui/react-popover";
import dayjs from "dayjs";
import { FaHistory } from "react-icons/fa";
import { match, P } from "ts-pattern";
import { Toggle } from "./Toggle";

import { FeatureFlagHistory } from "@prisma/client";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { RouterOutputs, trpc } from "utils/trpc";
import { Avatar } from "./Avatar";
import { LoadingSpinner } from "./LoadingSpinner";
import { Modal } from "./Modal";
import {
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "components/Tooltip";

dayjs.extend(relativeTime);

const getHistoryEventDescription = (event: FeatureFlagHistory) => {
  return match(event)
    .with(
      {
        newValue: false,
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
            className="max-w-lg select-none rounded-[4px] bg-gray-800 px-[15px] py-[10px] text-[15px] leading-none text-pink-50 shadow-md will-change-[transform,opacity] focus:shadow-md data-[state=open]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade"
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

const ConfirmToggleModal = ({
  isOpen,
  onClose,
  flagValueId,
  description,
  projectId,
  isEnabled,
  flagName,
}: {
  isOpen: boolean;
  onClose: () => void;
  flagValueId: string;
  description: string;
  projectId: string;
  isEnabled: boolean;
  flagName: string;
}) => {
  const trpcContext = trpc.useContext();

  const { mutate: toggleFlag } = trpc.flags.toggleFlag.useMutation({
    onSuccess(_, { enabled, flagValueId }) {
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

        valueToUpdate.isEnabled = enabled;
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
      confirmText={`Toggle ${isEnabled ? "off" : "on"}`}
      onConfirm={() => toggleFlag({ enabled: !isEnabled, flagValueId })}
      isOpen={isOpen}
      onClose={onClose}
    >
      <h2>
        Are you sure that you want to toggle the flag <i>{flagName}</i>?
      </h2>
      <h3 className="mt-4 text-sm font-semibold">Description:</h3>
      <p dangerouslySetInnerHTML={{ __html: description }} />
    </Modal>
  );
};

type Props = {
  flag: RouterOutputs["flags"]["getFlags"]["flags"][number];
  isEnabled: boolean;
  projectId: string;
  environmentName: string;
  flagValueId: string;
};

export function FeatureFlag({
  flag,
  projectId,
  isEnabled,
  environmentName,
  flagValueId,
}: Props) {
  const [isToggleConfirmationModalOpen, setIsToggleConfirmationModalOpen] =
    useState(false);

  return (
    <>
      <span
        key={flag.id}
        className="mr-2 flex w-full items-center justify-between space-x-3 rounded-xl bg-gray-100 py-3 pl-3 pr-4 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300"
      >
        <Toggle
          label={environmentName}
          onChange={() => setIsToggleConfirmationModalOpen(true)}
          isChecked={isEnabled}
        />
        <HistoryButton flagValueId={flagValueId} />
      </span>

      <ConfirmToggleModal
        isOpen={isToggleConfirmationModalOpen}
        onClose={() => setIsToggleConfirmationModalOpen(false)}
        isEnabled={isEnabled}
        flagValueId={flagValueId}
        description={flag.description ?? ""}
        projectId={projectId}
        flagName={flag.name}
      />
    </>
  );
}
