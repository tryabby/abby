import { useProjectId } from "lib/hooks/useProjectId";
import { toast } from "react-hot-toast";
import { trpc } from "utils/trpc";
import { Modal } from "./Modal";
import { useRouter } from "next/router";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  goToProjects: () => void;
};

export function DeleteProjectModal({ isOpen, onClose, goToProjects }: Props) {
  const router = useRouter();
  const projectId = useProjectId();
  const trpcContext = trpc.useContext();

  const { mutate: deleteProject } = trpc.project.deleteProject.useMutation({
    onSuccess() {
      toast.success("Project deleted");
      onClose();
      trpcContext.project.getProjectData.invalidate();
      trpcContext.user.getProjects.invalidate();
      router.push("/projects");
    },
  });

  return (
    <Modal
      title="Delete project"
      confirmText="Delete project"
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => {
        if (!projectId) return;
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
