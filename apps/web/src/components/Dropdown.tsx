import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "lib/utils";
import type React from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { twMerge } from "tailwind-merge";

type Props = {
  triggerIcon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export const Dropdown = ({ triggerIcon: Icon, children, className }: Props) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-[35px] w-[35px] items-center justify-center rounded-md bg-transparent text-pink-50 outline-none hover:bg-gray-800 focus:bg-gray-800",
            className
          )}
        >
          {Icon ?? <BsThreeDotsVertical />}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="min-w-[220px] space-y-1 rounded-md bg-gray-800 p-[5px] py-2 shadow-lg will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade"
          sideOffset={5}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

type ItemProps = {
  children: React.ReactNode;
  shortcut?: string;
} & DropdownMenu.MenuItemProps;

export const Item = ({
  children,
  shortcut,
  className,
  ...itemProps
}: ItemProps) => (
  <DropdownMenu.Item
    className={twMerge(
      "data-[highlighted]:text-100 group relative flex h-[25px] w-full cursor-pointer select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[14px] leading-none text-pink-50 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-gray-600 data-[disabled]:text-pink-50/20",
      className
    )}
    {...itemProps}
  >
    {children}
    {shortcut && (
      <div className="ml-auto pl-[20px] text-inherit group-data-[disabled]:text-inherit group-data-[highlighted]:text-white">
        {shortcut}
      </div>
    )}
  </DropdownMenu.Item>
);

Item.displayName = "DropdownItem";
