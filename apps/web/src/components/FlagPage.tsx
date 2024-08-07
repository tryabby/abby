import type { FeatureFlagType } from "@prisma/client";
import type { InferQueryResult } from "@trpc/react-query/dist/utils/inferReactQueryProcedure";
import { AddFeatureFlagModal } from "components/AddFeatureFlagModal";
import { CreateEnvironmentModal } from "components/CreateEnvironmentModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "components/DropdownMenu";
import { Editor } from "components/Editor";
import { FeatureFlag } from "components/FeatureFlag";
import { Modal } from "components/Modal";
import { Tooltip, TooltipContent, TooltipTrigger } from "components/Tooltip";
import { Input } from "components/ui/input";
import { useProjectId } from "lib/hooks/useProjectId";
import { EditIcon, FileEditIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { AiOutlinePlus } from "react-icons/ai";
import { BiInfoCircle } from "react-icons/bi";
import { BsThreeDotsVertical } from "react-icons/bs";
import type { appRouter } from "server/trpc/router/_app";
import { trpc } from "utils/trpc";
import { Button } from "./ui/button";

const EditTitleModal = ({
  flagId,
  isOpen,
  onClose,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  flagId: string;
}) => {
  const [newTitle, setNewTitle] = useState(title);
  const trpcContext = trpc.useContext();
  const { mutate: updateTitle } = trpc.flags.updateFlagTitle.useMutation({
    onSuccess() {
      toast.success("Successfully updated the title");
      trpcContext.flags.getFlags.invalidate();
      onClose();
    },
    onError() {
      toast.error("Failed to update the title");
    },
  });
  return (
    <Modal
      title="Update Title"
      confirmText="Save"
      onConfirm={() => updateTitle({ flagId, title: newTitle })}
      isOpen={isOpen}
      onClose={onClose}
      subtitle="The title is used to identify the flag in the UI."
    >
      <Input
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="MyFlag"
      />
    </Modal>
  );
};

const EditDescriptionModal = ({
  isOpen,
  onClose,
  flagId,
  description,
}: {
  isOpen: boolean;
  onClose: () => void;
  flagId: string;
  description: string;
}) => {
  const [newDescription, setNewDescription] = useState(description);
  const trpcContext = trpc.useContext();
  const { mutate: updateDescription } =
    trpc.flags.updateDescription.useMutation({
      onSuccess() {
        toast.success("Successfully updated description");
        trpcContext.flags.getFlags.invalidate();
        onClose();
      },
      onError() {
        toast.error("Failed to update description");
      },
    });

  return (
    <Modal
      title="Update Description"
      confirmText="Save"
      onConfirm={() =>
        updateDescription({ flagId, description: newDescription })
      }
      size="full"
      isOpen={isOpen}
      onClose={onClose}
    >
      <Editor
        className="w-full"
        content={newDescription}
        onUpdate={setNewDescription}
      />
    </Modal>
  );
};

const DeleteFlagModal = ({
  isOpen,
  onClose,
  projectId,
  flagName,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  flagName: string;
  type: FeatureFlagType;
}) => {
  const trpcContext = trpc.useContext();
  const { mutate: deleteFlag } = trpc.flags.removeFlag.useMutation({
    onSuccess() {
      toast.success(`Deleted ${type === "BOOLEAN" ? "flag" : "config"}`);
      trpcContext.flags.getFlags.invalidate();
      onClose();
    },
    onError() {
      toast.error(`Failed to delete ${type === "BOOLEAN" ? "flag" : "config"}`);
    },
  });

  return (
    <Modal
      title="Delete Flag"
      confirmText="Delete"
      onConfirm={() => deleteFlag({ name: flagName, projectId })}
      isOpen={isOpen}
      onClose={onClose}
    >
      <p>
        Are you sure that you want to delete the Flag <b>{flagName}</b>?
      </p>
    </Modal>
  );
};

export const FeatureFlagPageContent = ({
  data,
  type,
}: {
  data: NonNullable<
    InferQueryResult<(typeof appRouter)["flags"]["getFlags"]>["data"]
  >;
  type: "Flags" | "Remote Config";
}) => {
  const [isCreateFlagModalOpen, setIsCreateFlagModalOpen] = useState(false);
  const [activeFlagInfo, setActiveFlagInfo] = useState<{
    id: string;
    action: "editDescription" | "editName" | "delete";
  } | null>(null);

  const [isCreateEnvironmentModalOpen, setIsCreateEnvironmentModalOpen] =
    useState(false);

  const projectId = useProjectId();

  const activeFlag = data.flags.find((flag) => flag.id === activeFlagInfo?.id);

  if (data.environments.length === 0)
    return (
      <div className="mt-48 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold">
          You don&apos;t have any environments set up!
        </h1>
        <h2>
          You need to have at least one environment to set up{" "}
          {type === "Flags" ? "feature flags" : "remote config"}
        </h2>
        <Button
          className="mt-4"
          onClick={() => setIsCreateEnvironmentModalOpen(true)}
        >
          Create Environment
        </Button>
        <CreateEnvironmentModal
          isOpen={isCreateEnvironmentModalOpen}
          onClose={() => setIsCreateEnvironmentModalOpen(false)}
          projectId={projectId}
        />
      </div>
    );

  return (
    <>
      <div>
        <div className="flex justify-end space-x-2">
          <Button
            className="mb-4 flex items-center space-x-2"
            onClick={() => setIsCreateEnvironmentModalOpen(true)}
            variant="secondary"
          >
            <AiOutlinePlus /> <span>Add Env</span>
          </Button>
          <Button
            className="mb-4 flex items-center space-x-2 text-primary-foreground"
            onClick={() => setIsCreateFlagModalOpen(true)}
          >
            <AiOutlinePlus />{" "}
            <span>Add {type === "Flags" ? "Flag" : "Config"}</span>
          </Button>
          <AddFeatureFlagModal
            isOpen={isCreateFlagModalOpen}
            onClose={() => setIsCreateFlagModalOpen(false)}
            projectId={projectId}
            isRemoteConfig={type === "Remote Config"}
          />
          <CreateEnvironmentModal
            isOpen={isCreateEnvironmentModalOpen}
            onClose={() => setIsCreateEnvironmentModalOpen(false)}
            projectId={projectId}
          />
        </div>

        <div className="space-y-3">
          {data.flags.map((currentFlag) => {
            return (
              <section
                key={currentFlag.id}
                className="w-full rounded-md bg-secondary p-4"
              >
                <div className="flex justify-between">
                  <div className="flex items-center space-x-3">
                    <h2 className="font-bold text-pink-200">
                      {currentFlag.name}
                    </h2>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button">
                          <BiInfoCircle />
                        </button>
                      </TooltipTrigger>

                      <TooltipContent
                        side="bottom"
                        align="start"
                        alignOffset={-35}
                        className="w-[250px]"
                      >
                        <h1 className="mb-4 font-semibold">Description:</h1>
                        <p
                          className="prose prose-invert text-pink-50"
                          // biome-ignore lint/security/noDangerouslySetInnerHtml:
                          dangerouslySetInnerHTML={{
                            __html:
                              currentFlag.description ??
                              "<p>No description</p>",
                          }}
                        />
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <BsThreeDotsVertical />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          setActiveFlagInfo({
                            id: currentFlag.id,
                            action: "editName",
                          });
                        }}
                      >
                        <EditIcon className="mr-4 h-4 w-4" />
                        Edit Name
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          setActiveFlagInfo({
                            id: currentFlag.id,
                            action: "editDescription",
                          });
                        }}
                      >
                        <FileEditIcon className="mr-4 h-4 w-4" />
                        Edit Description
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer focus:!bg-red-700 focus:!text-white"
                        onClick={() => {
                          setActiveFlagInfo({
                            id: currentFlag.id,
                            action: "delete",
                          });
                        }}
                      >
                        <TrashIcon className="mr-4 h-4 w-4" />
                        Delete {type === "Flags" ? "Flag" : "Config"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="relative mt-3 grid grid-cols-[repeat(auto-fill,minmax(205px,1fr))] gap-x-8 gap-y-4 pr-2">
                  {currentFlag.values
                    .sort(
                      (a, b) =>
                        a.environment.sortIndex - b.environment.sortIndex
                    )
                    .map((flagValue) => (
                      <FeatureFlag
                        key={flagValue.flagId + flagValue.environment.id}
                        flag={currentFlag}
                        projectId={projectId}
                        environmentName={flagValue.environment.name}
                        flagValueId={flagValue.id}
                        type={currentFlag.type}
                      />
                    ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      {activeFlag && (
        <>
          <EditTitleModal
            key={activeFlag.id}
            flagId={activeFlag.id}
            title={activeFlag.name ?? ""}
            isOpen={activeFlagInfo?.action === "editName"}
            onClose={() => setActiveFlagInfo(null)}
          />
          <EditDescriptionModal
            key={activeFlag.id}
            flagId={activeFlag.id}
            description={activeFlag.description ?? ""}
            isOpen={activeFlagInfo?.action === "editDescription"}
            onClose={() => setActiveFlagInfo(null)}
          />
          <DeleteFlagModal
            flagName={activeFlag.name}
            projectId={projectId}
            isOpen={activeFlagInfo?.action === "delete"}
            onClose={() => setActiveFlagInfo(null)}
            type={activeFlag.type}
          />
        </>
      )}
    </>
  );
};
