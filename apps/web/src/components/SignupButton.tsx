import { useAbby } from "lib/abby";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

export function SignupButton({ className }: { className?: string }) {
  const { variant, onAct } = useAbby("SignupButton");
  return (
    <div className="flex flex-col items-center">
      <Link
        href="/login"
        onClick={() => onAct()}
        className={twMerge(
          "mt-12 rounded-xl bg-gray-900 px-6 py-4 text-2xl font-semibold text-white no-underline transition-transform duration-150 ease-in-out hover:scale-110",
          className
        )}
      >
        {variant === "A" && "Test Now"}
        {variant === "B" && "Sign Up for Free"}
      </Link>
      <span className="mt-4 text-xs text-gray-600">
        Free forever. No Credit Card required
      </span>
    </div>
  );
}
