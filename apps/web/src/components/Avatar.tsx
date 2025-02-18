import * as RadixAvatar from "@radix-ui/react-avatar";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

function getNameFromEmail(email: string) {
  const [name] = email.split("@");
  if (name?.includes(".")) {
    const [firstName, lastName] = name.split(".");
    return `${firstName} ${lastName}`;
  }
  return name;
}

type Props = {
  imageUrl?: string;
  userName?: string;
} & ComponentProps<(typeof RadixAvatar)["Root"]>;

export const Avatar = ({ imageUrl, userName, className, ...props }: Props) => (
  <RadixAvatar.Root
    // biome-ignore lint/a11y/useSemanticElements: <explanation>
    role="button"
    className={twMerge(
      "inline-flex h-[45px] w-[45px] select-none items-center justify-center overflow-hidden rounded-full bg-gray-600 align-middle",
      className
    )}
    {...props}
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
