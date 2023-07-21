type Props = {
  currentValue: number;
  maxValue: number;
};

export function Progress({ currentValue, maxValue }: Props) {
  const currentValuePercentage = Math.min((currentValue / maxValue) * 100, 100);
  return (
    <div className="w-full rounded-full bg-gray-700" role="progressbar">
      <div
        className="rounded-full bg-accent-background p-1 text-center text-xs font-medium leading-none text-pink-100"
        style={{ width: `${currentValuePercentage}%` }}
      >
        {" "}
        {currentValuePercentage.toFixed(2)}%
      </div>
    </div>
  );
}
