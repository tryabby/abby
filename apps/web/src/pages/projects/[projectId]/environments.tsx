import { CreateEnvironmentModal } from "components/CreateEnvironmentModal";
import { DashboardHeader } from "components/DashboardHeader";
import { Layout } from "components/Layout";
import { Modal } from "components/Modal";
import {
  FullPageLoadingSpinner,
  LoadingSpinner,
} from "components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { TitleEdit } from "components/TitleEdit";
import { useProjectId } from "lib/hooks/useProjectId";
import { NextPageWithLayout } from "pages/_app";
import { useState } from "react";
import { AiOutlineDelete, AiOutlineEdit, AiOutlinePlus } from "react-icons/ai";
import { trpc } from "utils/trpc";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Environment, FeatureFlagType } from "@prisma/client";
import { CSS } from "@dnd-kit/utilities";
import { MdDragIndicator } from "react-icons/md";
import { Button } from "components/ui/button";
import { GetStaticProps, GetStaticPaths } from "next";

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
  const { mutate: deleteEnvironment } =
    trpc.environments.deleteEnvironment.useMutation({
      onSuccess: () => {
        trpcContext.flags.getFlags.invalidate({ projectId });
      },
    });

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
    <div
      key={environment.id}
      className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center space-x-2">
        <button className="cursor-grab text-pink-50/60 focus:cursor-grabbing">
          <MdDragIndicator />
        </button>
        <TitleEdit
          title={environment.name}
          onSave={(newName) =>
            renameEnvironment({
              environmentId: environment.id,
              name: newName,
            })
          }
        />
      </div>
      <Button
        size="icon"
        variant="ghost"
        title="Delete Environment"
        onClick={() => setDeleteState()}
      >
        <AiOutlineDelete />
      </Button>
    </div>
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
      onSuccess: () => {
        toast.success("Deleted environment");
        trpcContext.flags.getFlags.invalidate({ projectId });
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
        <b>{environment.name}</b>?
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
    onSuccess: () => {
      trpcContext.flags.getFlags.invalidate({ projectId });
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
      <div className="mt-48 flex flex-col items-center justify-center">
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
    <>
      <div className="flex justify-end space-x-2">
        <Button
          className="mb-4 flex items-center space-x-2 text-primary-foreground"
          onClick={() => setIsCreateEnvironmentModalOpen(true)}
        >
          <AiOutlinePlus /> <span>Add Environment</span>
        </Button>

        <CreateEnvironmentModal
          isOpen={isCreateEnvironmentModalOpen}
          onClose={() => setIsCreateEnvironmentModalOpen(false)}
          projectId={projectId}
        />
      </div>
      <div className="space-y-8">
        <section className="space-y-3">
          <DndContext
            sensors={dndSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={environments}
              strategy={verticalListSortingStrategy}
            >
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
            </SortableContext>
          </DndContext>
        </section>
      </div>
      {activeEnvironment && (
        <>
          <DeleteEnvironmentModal
            environment={activeEnvironment}
            projectId={projectId}
            isOpen={activeEnvironmentInfo?.action === "delete"}
            onClose={() => setActiveEnvironmentInfo(null)}
          />
        </>
      )}
    </>
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
