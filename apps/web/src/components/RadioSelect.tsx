import React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { cn } from "lib/utils";

type RadioSelectProps<T extends string> = {
  options: Array<{ label: string | React.ReactNode; value: T }>;
  onChange: (value: T) => void;
  initialValue?: T;
  isDisabled?: boolean;
};

export function RadioSelect<T extends string = string>({
  options,
  onChange,
  initialValue,
  isDisabled,
}: RadioSelectProps<T>) {
  const [selected, setSelected] = React.useState(
    initialValue ?? options[0]?.value
  );
  return (
    <RadioGroup.Root
      className="flex gap-2.5"
      value={selected}
      aria-label="View density"
      onValueChange={(newValue) => {
        setSelected(newValue as T);
        onChange(newValue as T);
      }}
      disabled={isDisabled}
    >
      {options.map((option) => (
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          disabled={isDisabled}
          title={
            isDisabled
              ? "You can't change the type of a flag after the creation"
              : ""
          }
          className={cn(
            "flex h-[150px] flex-1 items-center justify-center gap-2.5 rounded-md border-2 border-white border-opacity-20 opacity-30 px-2.5 py-1.5 text-sm font-medium text-white disabled:opacity-40",
            selected === option.value && "border-green-600 border-opacity-100 opacity-100 text-pink-100"
          )}
        >
          {option.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
