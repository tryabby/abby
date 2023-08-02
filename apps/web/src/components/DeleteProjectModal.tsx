import { useProjectId } from "lib/hooks/useProjectId";
import { toast } from "react-hot-toast";
import { trpc } from "utils/trpc";
import { Modal } from "./Modal";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function DeleteProjectModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const projectId = useProjectId();
  const trpcContext = trpc.useContext();
  const { data: session, status, update } = useSession();

  const { mutate: deleteProject } = trpc.project.deleteProject.useMutation({
    async onSuccess() {
      if (!session?.user?.projectIds) return;

      toast.success("Project deleted");
      onClose();

      const newProjectIds = session?.user?.projectIds.filter(
        (id) => id !== projectId
      );

      await update({
        projectIds: newProjectIds,
        lastOpenProjectId: newProjectIds?.[0],
      });

      await router.push(`/projects`);

      trpcContext.project.getProjectData.invalidate();
      trpcContext.user.getProjects.invalidate();
    },
  });

  return (
    <Modal
      title="Delete project"
      confirmText="Delete project"
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => {
        if (!projectId || status !== "authenticated") return;
        deleteProject({ projectId });
      }}
    >
      <p className="text-white">
        Are you sure that you want to delete this Project? <br /> You will be
        unable to recover it afterwards!
      </p>
    </Modal>
  );
}
