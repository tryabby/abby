import { useTracking } from "lib/tracking";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { type ChangeEvent, useRef, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "utils/trpc";
import { Modal } from "./Modal";
import { Input } from "./ui/input";

type Props = {
  onClose: () => void;
};

export const CreateProjectModal = ({ onClose }: Props) => {
  const router = useRouter();
  const projectName = useRef("");
  const [isValidName, setIsValidName] = useState(true);
  const trpcContext = trpc.useContext();
  const session = useSession();
  const trackEvent = useTracking();

  const { mutateAsync: createProjectTRPC } =
    trpc.project.createProject.useMutation({
      onSuccess() {
        toast.success("Project created");
        trpcContext.project.getProjectData.invalidate();
        trpcContext.user.getProjects.invalidate();
      },
    });

  const createProject = async () => {
    if (projectName.current.length < 3) {
      setIsValidName(false);
      return;
    }
    const project = await createProjectTRPC({
      projectName: projectName.current,
    });

    onClose();
    if (!project) return;

    await session.update({
      projectIds: [...(session.data?.user?.projectIds ?? []), project.id],
      lastOpenProjectId: project.id,
    });
    trackEvent("Project Created");
    router.push(`/projects/${project.id}`);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    projectName.current = e.currentTarget.value;
    setIsValidName(projectName.current.length >= 3);
  };

  return (
    <Modal
      onClose={onClose}
      isOpen
      onConfirm={createProject}
      title="Create a new Project"
      confirmText="Create"
      size="full"
    >
      <Input
        type="text"
        placeholder="Project Name"
        required
        onChange={handleChange}
      />
      {!isValidName && (
        <div className="pt-4 text-red-600">
          Please enter a name with atleast 3 characters{" "}
        </div>
      )}
    </Modal>
  );
};
