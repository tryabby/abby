import { twMerge } from "tailwind-merge";

export function Divider({ className }: { className?: string }) {
  return (
    <div
      className={twMerge(
        "mx-auto h-[2px] max-w-xs bg-accent-background",
        className
      )}
    />
  );
}
