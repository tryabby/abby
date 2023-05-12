import { twMerge } from "tailwind-merge";

type ButtonProps<T extends React.ElementType = React.ElementType> = {
  as?: T;
  children?: React.ReactNode;
  title: string;
  icon: React.ReactNode;
  className?: string;
};

export function IconButton<T extends React.ElementType = "button">({
  icon,
  title,
  className,
  as,
  ...props
}: ButtonProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof ButtonProps<T>>) {
  const Component = as || "button";
  return (
    <Component
      title={title}
      aria-label={title}
      className={twMerge(
        "flex h-10 w-10 items-center justify-center rounded-lg bg-gray-600 text-lg text-white transition-all duration-200 ease-in-out hover:bg-gray-600/80 active:bg-gray-600/60",
        className
      )}
      {...props}
    >
      {icon}
    </Component>
  );
}
