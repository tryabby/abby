import type { LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";

type Props = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  icon: IconType | LucideIcon;
};

export function Feature({ children, icon: Icon, subtitle, title }: Props) {
  return (
    <div className="rounded-xl border bg-accent bg-clip-padding p-6 shadow-sm backdrop-blur-xl backdrop-filter">
      <div className="mr-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-pink-400 text-xl text-accent-foreground">
        <Icon />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-pink-500">{title}</h3>
      <h2 className="my-2 text-xl font-semibold text-accent-foreground">
        {subtitle}
      </h2>
      <p className="text-accent-foreground">{children}</p>
    </div>
  );
}
