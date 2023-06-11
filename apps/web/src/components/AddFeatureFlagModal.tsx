import { TRPCClientError } from "@trpc/client";
import { TRPC_ERROR_CODES_BY_KEY } from "@trpc/server/rpc";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "utils/trpc";
import { Modal } from "./Modal";
import { FeatureFlagType } from "@prisma/client";
import { FlagValue } from "@tryabby/core";

type Props = {
  onClose: () => void;
  isOpen: boolean;
  projectId: string;
};

export const AddFeatureFlagModal = ({ onClose, isOpen, projectId }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const ctx = trpc.useContext();
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<FeatureFlagType>("BOOLEAN");
  const [value, setValue] = useState<FlagValue>(false);
  const trimmedName = name.trim();

  const { mutateAsync } = trpc.flags.addFlag.useMutation({
    onSuccess() {
      ctx.flags.getFlags.invalidate({ projectId });
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create new feature flag"
      confirmText="Create"
      initialFocusRef={inputRef}
      onConfirm={async () => {
        if (!trimmedName) {
          toast.error("Name xis required");
          return;
        }
        try {
          await mutateAsync({
            name: trimmedName,
            projectId,
            value,
            type: type as any,
          });
          setName("");
          toast.success("Flag created");
          onClose();
        } catch (e) {
          toast.error(
            e instanceof TRPCClientError &&
              e.shape.code === TRPC_ERROR_CODES_BY_KEY.FORBIDDEN
              ? e.message
              : "Error creating flag"
          );
        }
      }}
    >
      <div>
        <label className="mb-1 block text-pink-50">Type</label>
        <select
          ref={selectRef}
          value={type}
          onChange={(e) => {
            setValue("");
            setType(e.target.value as FeatureFlagType);
          }}
          className="form-input rounded-md border border-gray-500 bg-gray-600 px-4 py-2 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          {Object.entries(FeatureFlagType).map(([key, value]) => (
            <option key={key} value={value as string}>
              {value as string}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-pink-50">Name</label>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My new feature flag"
          className="form-input rounded-md border border-gray-500 bg-gray-600 px-4 py-2 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-pink-50">Value</label>
        {type === "BOOLEAN" && (
          <select
            value={value.toString()}
            onChange={(e) => setValue(e.target.value)}
            className="form-input rounded-md border border-gray-500 bg-gray-600 px-4 py-2 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        )}
        {type === "STRING" && (
          <input
            type="text"
            value={value.toString()}
            onChange={(e) => setValue(e.target.value)}
            placeholder="My new feature flag"
            className="form-input rounded-md border border-gray-500 bg-gray-600 px-4 py-2 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          />
        )}
        {type === "NUMBER" && (
          <input
            type="number"
            value={value.toString()}
            onChange={(e) => setValue(e.target.valueAsNumber)}
            placeholder="My new feature flag"
            className="form-input rounded-md border border-gray-500 bg-gray-600 px-4 py-2 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          />
        )}
      </div>
    </Modal>
  );
};
