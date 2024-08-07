import type React from "react";
import { twMerge } from "tailwind-merge";

interface ButtonProps<T extends React.ElementType = React.ElementType> {
  as?: T;
  children?: React.ReactNode;
}

export function Button<T extends React.ElementType = "button">({
  children,
  className,
  as,
  ...props
}: ButtonProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof ButtonProps<T>>) {
  const Component = as || "button";
  return (
    <Component
      {...props}
      className={twMerge(
        "rounded-sm bg-blue-300 px-3 py-0.5 text-gray-800 transition-colors duration-200 ease-in-out hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-blue-300",
        className
      )}
    >
      {children}
    </Component>
  );
}
