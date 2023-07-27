import { ComponentPropsWithRef } from "react";
import { twMerge } from "tailwind-merge";

type Props = ComponentPropsWithRef<"button">;

export function DashboardButton({ className, ...props }: Props) {
  return (
    <button
      className={twMerge(
        "rounded-md bg-accent-background px-3 py-0.5 text-accent-foreground transition-colors duration-200 ease-in-out hover:bg-accent-background-hover disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}
