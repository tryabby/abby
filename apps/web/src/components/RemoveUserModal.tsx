import type { User } from "@prisma/client";
import { useProjectId } from "lib/hooks/useProjectId";
import { toast } from "react-hot-toast";
import { trpc } from "utils/trpc";
import { Modal } from "./Modal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
};

export function RemoveUserModal({ isOpen, onClose, user }: Props) {
  const projectId = useProjectId();
  const trpcContext = trpc.useContext();

  const { mutate: removeUser } = trpc.project.removeUser.useMutation({
    onSuccess() {
      toast.success("User removed");
      onClose();
      trpcContext.project.getProjectData.invalidate();
      trpcContext.user.getProjects.invalidate();
    },
  });

  return (
    <Modal
      title="Remove user"
      confirmText="Remove User"
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => {
        if (!user) return;
        removeUser({ userId: user.id, projectId });
      }}
    >
      <p className="text-white">
        Are you sure that you want to remove
        <pre className="mx-1 inline rounded-md bg-gray-900 p-1">
          {user?.email}
        </pre>
        ?
        <br />
        <br />
        You will need to re-invite them to the project if you change your mind.
      </p>
    </Modal>
  );
}
