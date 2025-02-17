import type { FeatureFlagType } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
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
import {} from "components/Tooltip";
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { EnvironmentBadge } from "components/ui/environment-badge";
import { Input } from "components/ui/input";
import Fuse from "fuse.js";
import { useProjectId } from "lib/hooks/useProjectId";
import {
  ChevronRight,
  EditIcon,
  FileEditIcon,
  Search,
  Sparkle,
  TrashIcon,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { AiOutlinePlus } from "react-icons/ai";
import { BsThreeDotsVertical } from "react-icons/bs";
import type { appRouter } from "server/trpc/router/_app";
import { trpc } from "utils/trpc";

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
  data: NonNullable<inferRouterOutputs<typeof appRouter>["flags"]["getFlags"]>;
  type: "Flags" | "Remote Config";
}) => {
  const searchQueryRef = useRef<string | null>();
  const [isCreateFlagModalOpen, setIsCreateFlagModalOpen] = useState(false);
  const [activeFlagInfo, setActiveFlagInfo] = useState<{
    id: string;
    action: "editDescription" | "editName" | "delete";
  } | null>(null);

  const [flags, setFlags] = useState(data.flags);
  const [isCreateEnvironmentModalOpen, setIsCreateEnvironmentModalOpen] =
    useState(false);
  const createFlagRemovalPRMutation =
    trpc.flags.createFlagRemovalPR.useMutation();
  const projectId = useProjectId();
  const router = useRouter();

  const fuse = useMemo(
    () => new Fuse(data.flags, { keys: ["name"] }),
    [data.flags]
  );

  useEffect(() => {
    if (!searchQueryRef.current) {
      setFlags(data.flags);
      return;
    }
    const results = fuse.search(searchQueryRef.current);
    setFlags(results.map((result) => result.item));
  }, [fuse.search, data.flags]);

  const onSearch = () => {
    const query = searchQueryRef.current;
    if (!query) {
      setFlags(data.flags);
      return;
    }

    const results = fuse.search(query);
    setFlags(results.map((result) => result.item));
  };

  const activeFlag = data.flags.find((flag) => flag.id === activeFlagInfo?.id);

  if (data.environments.length === 0)
    return (
      <div className="flex flex-col items-center justify-center mt-48">
        <h1 className="text-2xl font-semibold">
          You don't have any environments set up!
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="relative w-[300px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search flags..."
              className="w-full pl-8"
              onChange={(e) => {
                searchQueryRef.current = e.target.value;
                onSearch();
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Available Environments
            </span>
            <div className="flex gap-2">
              {data.environments.map((env) => (
                <EnvironmentBadge key={env.id} name={env.name} size="default" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setIsCreateFlagModalOpen(true)}>
            <AiOutlinePlus className="w-4 h-4 mr-2" />
            Add {type === "Flags" ? "Flag" : "Config"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {flags.map((currentFlag) => (
          <Card
            key={currentFlag.id}
            className="relative overflow-hidden transition-all duration-200 group/flag hover:shadow-md hover:border-primary/20"
          >
            <div className="absolute top-0 right-0 h-full w-1.5 bg-gradient-to-b from-primary/20 to-primary/5" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base font-semibold transition-colors group-hover/flag:text-primary">
                        {currentFlag.name}
                      </CardTitle>
                      {currentFlag.type !== "BOOLEAN" && (
                        <span className="px-2 py-0.5 text-xs rounded-md bg-blue-500/10 text-blue-500">
                          {currentFlag.type.toLowerCase()}
                        </span>
                      )}
                    </div>
                    {currentFlag.description && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-1">
                        {currentFlag.description.replace(/<[^>]*>/g, "")}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative z-10 w-8 h-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="sr-only">Open menu</span>
                      <BsThreeDotsVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFlagInfo({
                          id: currentFlag.id,
                          action: "editName",
                        });
                      }}
                    >
                      <EditIcon className="w-4 h-4 mr-2" />
                      Edit Name
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFlagInfo({
                          id: currentFlag.id,
                          action: "editDescription",
                        });
                      }}
                    >
                      <FileEditIcon className="w-4 h-4 mr-2" />
                      Edit Description
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!data.hasGithubIntegration}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const url = await toast.promise(
                          createFlagRemovalPRMutation.mutateAsync({
                            flagId: currentFlag.id,
                          }),
                          {
                            loading: "Creating removal PR...",
                            success: "Successfully created removal PR",
                            error: "Failed to create removal PR",
                          }
                        );
                        window.open(url, "_blank");
                      }}
                    >
                      <Sparkle className="w-4 h-4 mr-2" />
                      Create Removal PR
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFlagInfo({
                          id: currentFlag.id,
                          action: "delete",
                        });
                      }}
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Delete {type === "Flags" ? "Flag" : "Config"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
                  {currentFlag.values
                    .sort(
                      (a, b) =>
                        a.environment.sortIndex - b.environment.sortIndex
                    )
                    .map((flagValue) => (
                      <div
                        key={flagValue.flagId + flagValue.environment.id}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <EnvironmentBadge
                            name={flagValue.environment.name}
                            size="default"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-2 text-xs h-7 bg-muted/50 hover:bg-muted group/configure"
                            onClick={() =>
                              router.push(
                                `/projects/${projectId}/flags/${flagValue.id}`
                              )
                            }
                          >
                            Configure
                            <ChevronRight className="ml-1 h-3 w-3 group-hover/configure:translate-x-0.5 transition-transform" />
                          </Button>
                        </div>
                        <FeatureFlag
                          flag={currentFlag}
                          projectId={projectId}
                          environmentName={flagValue.environment.name}
                          flagValueId={flagValue.id}
                          type={currentFlag.type}
                          minimal
                        />
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  );
};
