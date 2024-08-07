import { twMerge } from "tailwind-merge";

export function LoadingSpinner({
  height,
  width,
  className,
}: {
  height?: string;
  width?: string;
  className?: string;
}) {
  return (
    <svg
      className={twMerge(
        "-ml-1 mr-3 h-5 w-5 animate-spin text-white",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      style={{ height, width }}
    >
      <title>Loading Spinner</title>
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export const FullPageLoadingSpinner = () => (
  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
    <LoadingSpinner className="h-8 w-8" />
  </div>
);
