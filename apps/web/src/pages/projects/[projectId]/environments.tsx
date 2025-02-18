import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type Environment, FeatureFlagType } from "@prisma/client";
import { CreateEnvironmentModal } from "components/CreateEnvironmentModal";
import { DashboardHeader } from "components/DashboardHeader";
import { Layout } from "components/Layout";
import { FullPageLoadingSpinner } from "components/LoadingSpinner";
import { Modal } from "components/Modal";
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader } from "components/ui/card";
import { EnvironmentBadge } from "components/ui/environment-badge";
import { useProjectId } from "lib/hooks/useProjectId";
import { GripVertical, Pencil, Trash } from "lucide-react";
import type { GetStaticPaths, GetStaticProps } from "next";
import type { NextPageWithLayout } from "pages/_app";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "utils/trpc";

function EnvironmentItem({
  environment,
  projectId,
  setDeleteState,
}: {
  environment: Environment;
  projectId: string;
  setDeleteState: () => void;
}) {
  const trpcContext = trpc.useContext();

  const { mutate: renameEnvironment } =
    trpc.environments.updateName.useMutation({
      onSuccess: () => {
        trpcContext.flags.getFlags.invalidate({ projectId });
      },
    });

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: environment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group"
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 cursor-grab focus:cursor-grabbing hover:bg-transparent"
          >
            <GripVertical className="w-5 h-5 text-muted-foreground/60" />
          </Button>
          <EnvironmentBadge name={environment.name} size="lg" />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const newName = prompt("Enter new name", environment.name);
              if (newName && newName !== environment.name) {
                renameEnvironment({
                  environmentId: environment.id,
                  name: newName,
                });
              }
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteState()}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const DeleteEnvironmentModal = ({
  isOpen,
  onClose,
  environment,
  projectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  environment: Environment;
  projectId: string;
}) => {
  const trpcContext = trpc.useContext();

  const { mutate: deleteEnvironment } =
    trpc.environments.deleteEnvironment.useMutation({
      onSuccess: async () => {
        await trpcContext.flags.getFlags.invalidate({ projectId });
        toast.success("Deleted environment");
        onClose();
      },
      onError() {
        toast.error("Failed to delete environment");
      },
    });

  return (
    <Modal
      title="Delete Environment"
      confirmText="Delete"
      onConfirm={() => deleteEnvironment({ environmentId: environment.id })}
      isOpen={isOpen}
      onClose={onClose}
    >
      <p>
        Are you sure that you want to delete the environment{" "}
        <EnvironmentBadge name={environment.name} />?
      </p>
    </Modal>
  );
};

const EnvironmentPage: NextPageWithLayout = () => {
  const trpcContext = trpc.useContext();
  const [environments, setEnvironments] = useState<Array<Environment>>([]);
  const [isCreateEnvironmentModalOpen, setIsCreateEnvironmentModalOpen] =
    useState(false);
  const [activeEnvironmentInfo, setActiveEnvironmentInfo] = useState<{
    id: string;
    action: "delete";
  } | null>(null);
  const projectId = useProjectId();

  const { data, isLoading, isError } = trpc.flags.getFlags.useQuery(
    {
      projectId,
      types: Object.values(FeatureFlagType),
    },
    {
      onSuccess: (data) => {
        setEnvironments(data.environments);
      },
    }
  );
  const activeEnvironment = data?.environments.find(
    (environment) => environment.id === activeEnvironmentInfo?.id
  );
  const { mutate } = trpc.environments.updateEnvironmentSort.useMutation({
    onSuccess: async () => {
      await trpcContext.flags.getFlags.invalidate({ projectId });
      toast.success("Successfully updated environment order");
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = environments.findIndex((el) => el.id === active.id);
      const newIndex = environments.findIndex((el) => el.id === over?.id);

      const newEnvs = arrayMove(environments, oldIndex, newIndex);
      setEnvironments(newEnvs);

      mutate({
        environments: newEnvs.map((env, i) => ({
          id: env.id,
          sortIndex: i,
        })),
      });
    }
  };

  const dndSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  if (isLoading || isError) return <FullPageLoadingSpinner />;

  if (data.environments.length === 0)
    return (
      <div className="flex flex-col items-center justify-center mt-48">
        <h1 className="text-2xl font-semibold">
          You don&apos;t have any environments set up!
        </h1>
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-muted-foreground">
            Manage Environments
          </h2>
          <p className="text-sm text-muted-foreground">
            Create and organize environments for your feature flags. Drag to
            reorder.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateEnvironmentModalOpen(true)}
          className="flex items-center"
        >
          Add Environment
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="grid gap-6">
            <DndContext
              sensors={dndSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={environments}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid gap-2">
                  {environments.map((environment) => (
                    <EnvironmentItem
                      key={environment.id}
                      environment={environment}
                      projectId={projectId}
                      setDeleteState={() => {
                        setActiveEnvironmentInfo({
                          id: environment.id,
                          action: "delete",
                        });
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </CardHeader>
      </Card>

      <CreateEnvironmentModal
        isOpen={isCreateEnvironmentModalOpen}
        onClose={() => setIsCreateEnvironmentModalOpen(false)}
        projectId={projectId}
      />
      {activeEnvironment && (
        <DeleteEnvironmentModal
          environment={activeEnvironment}
          projectId={projectId}
          isOpen={activeEnvironmentInfo?.action === "delete"}
          onClose={() => setActiveEnvironmentInfo(null)}
        />
      )}
    </div>
  );
};

EnvironmentPage.getLayout = (page) => {
  return (
    <Layout>
      <DashboardHeader title="Environments" />
      {page}
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
};

export default EnvironmentPage;
