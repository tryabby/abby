import { twMerge } from "tailwind-merge";

type Props = {
  currentValue: number;
  maxValue: number;
};

export function Progress({ currentValue, maxValue }: Props) {
  const currentValuePercentage = Math.min((currentValue / maxValue) * 100, 100);
  return (
    // biome-ignore lint/a11y/useFocusableInteractive: <explanation>
    <div
      className="relative h-6 w-full rounded-full bg-background"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={currentValuePercentage}
    >
      <div
        className={twMerge("h-full rounded-full bg-primary text-center")}
        style={{ width: `${currentValuePercentage}%` }}
      />
      <span
        className={twMerge(
          "absolute left-1/2 top-1/2 -translate-y-1/2 transform text-xs font-medium leading-none",
          currentValuePercentage > 50 ? "text-secondary" : "text-primary"
        )}
      >
        {currentValuePercentage.toFixed(2)}%
      </span>
    </div>
  );
}
