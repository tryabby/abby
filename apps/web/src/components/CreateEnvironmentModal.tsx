import { TRPCClientError } from "@trpc/client";
import { TRPC_ERROR_CODES_BY_KEY } from "@trpc/server/rpc";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { PlausibleEvents } from "types/plausible-events";
import { trpc } from "utils/trpc";
import { Modal } from "./Modal";
import { useTracking } from "lib/tracking";

type Props = {
  onClose: () => void;
  isOpen: boolean;
  projectId: string;
};

export const CreateEnvironmentModal = ({
  onClose,
  isOpen,
  projectId,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const ctx = trpc.useContext();
  const [name, setName] = useState<string>("");
  const trimmedName = name.trim();
  const { mutateAsync } = trpc.environments.addEnvironment.useMutation({
    onSuccess() {
      ctx.flags.getFlags.invalidate({ projectId });
    },
  });
  const trackEvent = useTracking();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create new Environment"
      confirmText="Create"
      initialFocusRef={inputRef}
      onConfirm={async () => {
        if (!trimmedName) {
          toast.error("Name is required");
          return;
        }
        try {
          await mutateAsync({
            name,
            projectId,
          });
          setName("");
          toast.success("Environment created");
          trackEvent("Environment Created");
          onClose();
        } catch (e) {
          toast.error(
            e instanceof TRPCClientError &&
              e.shape.code === TRPC_ERROR_CODES_BY_KEY.FORBIDDEN
              ? e.message
              : "Error creating environment"
          );
        }
      }}
    >
      <label className="mb-1 block text-pink-50">Name</label>
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        type="text"
        placeholder="production"
        className="form-input rounded-md border border-gray-500 bg-gray-600 px-4 py-2 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
      />
    </Modal>
  );
};
