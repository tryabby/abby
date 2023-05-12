import * as RadixAvatar from "@radix-ui/react-avatar";
import { twMerge } from "tailwind-merge";

function getNameFromEmail(email: string) {
  const [name] = email.split("@");
  if (name?.includes(".")) {
    const [firstName, lastName] = name.split(".");
    return `${firstName} ${lastName}`;
  }
  return name;
}

export const Avatar = ({
  imageUrl,
  userName,
  className,
}: {
  imageUrl?: string;
  userName?: string;
  className?: string;
}) => (
  <RadixAvatar.Root
    className={twMerge(
      "inline-flex h-[45px] w-[45px] select-none items-center justify-center overflow-hidden rounded-full bg-gray-600 align-middle",
      className
    )}
  >
    <RadixAvatar.Image
      className="h-full w-full rounded-[inherit] object-cover"
      src={imageUrl}
      alt={userName}
    />
    <RadixAvatar.Fallback
      className="leading-1 flex h-full w-full items-center justify-center bg-gray-600 font-medium text-pink-50"
      delayMs={600}
    >
      {(userName?.includes("@") ? getNameFromEmail(userName) : userName)
        ?.split(" ")
        .map((name) => name[0])}
    </RadixAvatar.Fallback>
  </RadixAvatar.Root>
);
