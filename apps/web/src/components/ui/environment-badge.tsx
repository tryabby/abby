import { getEnvironmentStyle } from "lib/environment-styles";
import { cn } from "lib/utils";

interface EnvironmentBadgeProps {
  name: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function EnvironmentBadge({
  name,
  className,
  size = "default",
}: EnvironmentBadgeProps) {
  const style = getEnvironmentStyle(name);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "default" && "px-3 py-1 text-sm",
        size === "lg" && "px-4 py-1.5 text-base",
        style.bg,
        style.border,
        className
      )}
    >
      <div
        className={cn(
          "rounded-full",
          size === "sm" && "h-1.5 w-1.5",
          size === "default" && "h-2 w-2",
          size === "lg" && "h-2.5 w-2.5",
          style.icon
        )}
      />
      <span className={cn("font-medium", style.text)}>{name}</span>
    </div>
  );
}
