import { TRPCClientError } from "@trpc/client";
import { TRPC_ERROR_CODES_BY_KEY } from "@trpc/server/rpc";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "utils/trpc";
import { Modal } from "./Modal";
import { FeatureFlagType } from "@prisma/client";
import { RadioSelect } from "./RadioSelect";
import { Input } from "./ui/input";
import { FlagIcon } from "./FlagIcon";

type Props = {
  onClose: () => void;
  isOpen: boolean;
  projectId: string;
};

type FormValues = {
  name: string;
  value: string;
  type: FeatureFlagType;
};

export const AddFeatureFlagModal = ({ onClose, isOpen, projectId }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const ctx = trpc.useContext();
  const [name, setName] = useState<FormValues["name"]>("");
  const [type, setType] = useState<FormValues["type"]>("BOOLEAN");
  const [value, setValue] = useState<FormValues["value"]>("false");

  const [errors, setErrors] = useState<Partial<FormValues>>({});

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
      size="full"
      onConfirm={async () => {
        const errors: Partial<FormValues> = {};
        if (!trimmedName) {
          errors.name = "Name is required";
        }
        if (!value) {
          errors.value = "Value is required";
        }
        if (Object.keys(errors).length > 0) {
          setErrors(errors);
          return;
        }

        try {
          await mutateAsync({
            name: trimmedName,
            projectId,
            value: value.toString(),
            type,
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
      <div className="flex flex-col space-y-5">
        <div>
          <label className="mb-1 block text-pink-50">Name</label>
          <Input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My new feature flag"
            className="form-input rounded-md border border-gray-500 bg-gray-600 px-4 py-2 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            required
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-pink-50">Type</label>
          <RadioSelect
            options={Object.entries(FeatureFlagType).map(([key, value]) => ({
              label: (
                <div className="flex items-center">
                  <FlagIcon type={value} className="mr-2 inline-block" />
                  <span className="capitalize">{key.toLowerCase()}</span>
                </div>
              ),
              value: value,
            }))}
            onChange={(value) => {
              setType(value);
              setValue("");
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-pink-50">Value</label>
          {type === "BOOLEAN" && (
            <select
              value={value.toString()}
              onChange={(e) => setValue(e.target.value)}
              className="form-input w-full rounded-md border border-gray-500 bg-gray-600 px-4 py-2 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              required
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
              placeholder="My Flag Value"
              className="form-input w-full rounded-md border border-gray-500 bg-gray-600 px-4 py-2 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              required
            />
          )}
          {type === "NUMBER" && (
            <input
              type="number"
              value={value.toString()}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                // prevent e, E, +, -
                ["e", "E", "+", "-"].includes(e.key) && e.preventDefault();
              }}
              placeholder="123"
              className="form-input w-full rounded-md border border-gray-500 bg-gray-600 px-4 py-2 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              required
            />
          )}
          {errors.value && (
            <p className="mt-1 text-sm text-red-500">{errors.value}</p>
          )}
        </div>
      </div>
    </Modal>
  );
};
