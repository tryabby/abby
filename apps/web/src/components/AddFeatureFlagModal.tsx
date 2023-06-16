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
import { cn } from "lib/utils";
import { getFlagTypeClassName } from "lib/flags";

type Props = {
  onClose: () => void;
  isOpen: boolean;
  projectId: string;
};

export type FlagFormValues = {
  name: string;
  value: string;
  type: FeatureFlagType;
};

export function ChangeFlagForm({
  initialValues,
  onChange: onChangeHandler,
  errors,
}: {
  initialValues: FlagFormValues;
  onChange: (values: FlagFormValues) => void;
  errors: Partial<FlagFormValues>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputClassName =
    "form-input w-full rounded-md border border-gray-500 bg-gray-600 px-4 py-2 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2";

  const [state, setState] = useState<FlagFormValues>(initialValues);

  const onChange = (values: Partial<FlagFormValues>) => {
    const newState = { ...state, ...values };
    setState(newState);
    onChangeHandler(newState);
  };

  return (
    <div className="flex flex-col space-y-5">
      <div>
        <label className="mb-1 block text-pink-50">Name</label>
        <input
          ref={inputRef}
          type="text"
          defaultValue={initialValues.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="My new feature flag"
          className={inputClassName}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-pink-50">Type</label>
        <RadioSelect
          options={Object.entries(FeatureFlagType).map(([key, flagType]) => ({
            label: (
              <div
                className={cn(
                  "flex items-center",
                  getFlagTypeClassName(flagType)
                )}
              >
                <FlagIcon type={flagType} className="mr-2 inline-block" />
                <span className="capitalize">{key.toLowerCase()}</span>
              </div>
            ),
            value: flagType,
          }))}
          onChange={(value) => {
            onChange({
              type: value,
              value: value === "BOOLEAN" ? "false" : "",
            });
          }}
          initialValue={initialValues.type}
        />
      </div>
      <div>
        <label className="mb-1 block text-pink-50">Value</label>
        {state.type === "BOOLEAN" && (
          <select
            value={state.value}
            onChange={(e) => onChange({ value: e.target.value })}
            className={inputClassName}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        )}
        {state.type === "STRING" && (
          <input
            type="text"
            value={state.value}
            onChange={(e) => onChange({ value: e.target.value })}
            placeholder="My Flag Value"
            className="form-input w-full rounded-md border border-gray-500 bg-gray-600 px-4 py-2 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          />
        )}
        {state.type === "NUMBER" && (
          <input
            type="number"
            value={state.value}
            onChange={(e) => onChange({ value: e.target.value })}
            onKeyDown={(e) => {
              // prevent e, E, +, -
              ["e", "E", "+", "-"].includes(e.key) && e.preventDefault();
            }}
            placeholder="123"
            className="form-input w-full rounded-md border border-gray-500 bg-gray-600 px-4 py-2 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          />
        )}
        {errors.value && (
          <p className="mt-1 text-sm text-red-500">{errors.value}</p>
        )}
      </div>
    </div>
  );
}

export const AddFeatureFlagModal = ({ onClose, isOpen, projectId }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const ctx = trpc.useContext();
  const stateRef = useRef<FlagFormValues>();

  const [errors, setErrors] = useState<Partial<FlagFormValues>>({});

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
        const errors: Partial<FlagFormValues> = {};
        if (!stateRef.current) return;

        const trimmedName = stateRef.current.name.trim();

        if (!trimmedName) {
          errors.name = "Name is required";
        }
        if (!stateRef.current?.value) {
          errors.value = "Value is required";
        }
        if (Object.keys(errors).length > 0) {
          setErrors(errors);
          return;
        }

        try {
          await mutateAsync({
            ...stateRef.current,
            name: trimmedName,
            projectId,
          });
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
      <ChangeFlagForm
        errors={errors}
        initialValues={{
          name: "",
          type: "BOOLEAN",
          value: "false",
        }}
        onChange={(newState) => (stateRef.current = newState)}
      />
    </Modal>
  );
};
