import { FeatureFlagType } from "@prisma/client";
import { TRPCClientError } from "@trpc/client";
import { TRPC_ERROR_CODES_BY_KEY } from "@trpc/server/rpc";
import { getFlagTypeClassName, transformDBFlagTypeToclient } from "lib/flags";
import { cn } from "lib/utils";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "utils/trpc";
import { FlagIcon } from "./FlagIcon";
import { JSONEditor } from "./JSONEditor";
import { Modal } from "./Modal";
import { RadioSelect } from "./RadioSelect";

import { Toggle } from "./Toggle";

import { useTracking } from "lib/tracking";

type Props = {
  onClose: () => void;
  isOpen: boolean;
  projectId: string;
  isRemoteConfig?: boolean;
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
  canChangeType = true,
  isRemoteConfig,
}: {
  initialValues: FlagFormValues;
  onChange: (values: FlagFormValues) => void;
  errors: Partial<FlagFormValues>;
  canChangeType?: boolean;
  isRemoteConfig?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputClassName =
    "form-input w-full rounded-md border border-gray-500 bg-gray-600 px-4 py-2 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2";

  const [state, setState] = useState<FlagFormValues>(initialValues);

  const valueRef = useRef<Record<FeatureFlagType, string>>({
    [FeatureFlagType.BOOLEAN]: "false",
    [FeatureFlagType.STRING]: "",
    [FeatureFlagType.NUMBER]: "",
    [FeatureFlagType.JSON]: "",
  });

  const onChange = (values: Partial<FlagFormValues>) => {
    const newState = { ...state, ...values };

    // if type changed, save the value
    if (values.type != null && values.type !== state.type) {
      valueRef.current[state.type] = state.value;
      newState.value = valueRef.current[newState.type] ?? "";
    }

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
          placeholder={isRemoteConfig ? "My Remote Config" : "My Feature Flag"}
          className={inputClassName}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>
      {isRemoteConfig && (
        <div>
          <label className="mb-1 block text-pink-50">Type</label>
          <RadioSelect
            isDisabled={!canChangeType}
            options={Object.entries(FeatureFlagType)
              // we omit boolean for remote config
              .filter(
                ([, flagType]) => isRemoteConfig && flagType !== "BOOLEAN"
              )
              .map(([key, flagType]) => ({
                label: (
                  <div
                    className={cn(
                      "flex items-center",
                      getFlagTypeClassName(flagType)
                    )}
                  >
                    <FlagIcon type={flagType} className="mr-2 inline-block" />
                    <span>{transformDBFlagTypeToclient(flagType)}</span>
                  </div>
                ),
                value: flagType,
              }))}
            onChange={(value) => {
              if (!canChangeType) return;

              onChange({
                type: value,
                value: value === "BOOLEAN" ? "false" : "",
              });
            }}
            initialValue={initialValues.type}
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-pink-50">Value</label>
        {state.type === "BOOLEAN" && (
          <Toggle
            isChecked={state.value === "true"}
            onChange={(newState) => onChange({ value: String(newState) })}
            label={state.value === "true" ? "Enabled" : "Disabled"}
          />
        )}
        {state.type === "STRING" && (
          <input
            type="text"
            value={state.value}
            onChange={(e) => onChange({ value: e.target.value })}
            placeholder={
              isRemoteConfig ? "My Remote Config" : "My Feature Flag"
            }
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
        {state.type === "JSON" && (
          <JSONEditor
            value={state.value}
            onChange={(e) => onChange({ value: e })}
          />
        )}
        {errors.value && (
          <p className="mt-1 text-sm text-red-500">{errors.value}</p>
        )}
      </div>
    </div>
  );
}

export const AddFeatureFlagModal = ({
  onClose,
  isOpen,
  projectId,
  isRemoteConfig,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const ctx = trpc.useContext();
  const stateRef = useRef<FlagFormValues>();
  const trackEvent = useTracking();

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
      title={
        isRemoteConfig ? "Create new remote config" : "Create new feature flag"
      }
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
          trackEvent("Feature Flag Created", {
            props: { "Feature Flag Type": stateRef.current.type },
          });
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
          type: isRemoteConfig ? "STRING" : "BOOLEAN",
          value: isRemoteConfig ? "" : "false",
        }}
        onChange={(newState) => (stateRef.current = newState)}
        canChangeType
        isRemoteConfig={isRemoteConfig}
      />
    </Modal>
  );
};
