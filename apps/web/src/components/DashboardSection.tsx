import { twMerge } from "tailwind-merge";

export function DashboardSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={twMerge("rounded-xl bg-gray-800 px-6 py-3", className)}>
      {children}
    </section>
  );
}

export function DashboardSectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={twMerge("text-xl font-semibold", className)}>{children}</h2>
  );
}

export function DashboardSectionSubtitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={twMerge("text-sm text-pink-50/80", className)}>
      {children}
    </h3>
  );
}
