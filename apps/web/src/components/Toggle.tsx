import { useId } from "react";
import { Switch } from "./ui/switch";
export function Toggle({
  label,
  onChange,
  isChecked,
}: {
  isChecked?: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id={id}
        checked={isChecked}
        onCheckedChange={(checked) => onChange(checked)}
      />
      <label
        htmlFor={id}
        className="cursor-pointer text-sm font-medium leading-none text-gray-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
    </div>
  );
}
