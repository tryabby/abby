import { Menu, Transition } from "@headlessui/react";
import { DOCS_URL } from "@tryabby/core";
import clsx from "clsx";
import Logo from "components/Logo";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "components/ui/navigation-menu";
import { cn } from "lib/utils";
import { Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Fragment, useLayoutEffect, useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { twMerge } from "tailwind-merge";
import { trpc } from "utils/trpc";
import * as React from "react";

type NavItem = {
  title: string;
} & (
  | { href: string }
  | { subItems: { title: string; subTitle: string; href: string }[] }
);

const NAV_ITEMS = [
  {
    title: "Features",
    href: "/#features",
  },
  {
    title: "Pricing",
    href: "/#pricing",
  },
  {
    title: "Developer",
    subItems: [
      {
        title: "Devtools",
        subTitle: "Painless Debugging",
        href: "/devtools",
      },
      {
        title: "Documentation",
        subTitle: "Learn how to use Abby",
        href: DOCS_URL,
      },
    ],
  },
  {
    title: "Learn More",
    subItems: [
      {
        title: "Tips & Insights",
        subTitle: "Learn how to use Abby",
        href: "/about",
      },
      {
        title: "Contact Us",
        subTitle: "Get in touch with us",
        href: "/contact",
      },
    ],
  },
] satisfies Array<NavItem>;

function MobileNav({ isInverted }: { isInverted?: boolean }) {
  const { data, status } = useSession();

  return (
    <Menu>
      <Menu.Button
        aria-label="Open the navigation menu"
        className="flex h-12 w-12 items-center justify-center space-x-2 rounded-lg font-medium transition-colors duration-200 ease-in-out hover:bg-pink-300/40 lg:hidden"
      >
        <GiHamburgerMenu />
      </Menu.Button>
      <Transition
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
        as={Fragment}
      >
        <Menu.Items
          className={cn(
            "absolute right-12 top-[80px] z-10 flex w-[calc(100%-6rem)] flex-col space-y-4 rounded-lg p-4 shadow-xl",
            isInverted ? "bg-zinc-800" : "bg-white"
          )}
        >
          {NAV_ITEMS.flatMap((i) =>
            i.subItems
              ? i.subItems.map((i) => ({ title: i.title, href: i.href }))
              : i
          ).map(({ href, title }) => (
            <Menu.Item key={href}>
              {({ active }) => (
                <Link
                  className={clsx("rounded-lg p-2", active && "bg-pink-200")}
                  href={href ?? ""}
                >
                  {title}
                </Link>
              )}
            </Menu.Item>
          ))}
          <Menu.Item>
            {status === "authenticated" ? (
              <NavItem
                href={`/projects/${data.user?.projectIds[0]}`}
                isProminent
                className="mr-0"
              >
                Dashboard
              </NavItem>
            ) : (
              <NavItem isProminent href="/login" className="mr-0">
                Log In
              </NavItem>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

type NavItemProps = {
  children: React.ReactNode;
  isProminent?: boolean;
  className?: string;
} & (
  | {
      href: string;
      onClick?: never;
    }
  | {
      href?: never;
      onClick: () => void;
    }
);
function NavItem({
  href,
  children,
  onClick,
  isProminent,
  className,
}: NavItemProps) {
  return (
    <Link
      href={href ?? ""}
      onClick={onClick}
      scroll={false}
      className={clsx(
        "mr-2 flex items-center space-x-2 rounded-lg px-4 py-2 font-medium transition-all duration-200 ease-in-out",
        className,
        isProminent
          ? "bg-accent-background text-accent-foreground hover:opacity-90"
          : "hover:bg-pink-300/40"
      )}
    >
      {children}
    </Link>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link>
>(({ className, title, children, ...props }, ref) => {
  return (
    <NavigationMenuLink asChild>
      <Link
        ref={ref}
        className={cn(
          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-primary-hover hover:text-primary-foreground focus:bg-primary-hover focus:text-primary-foreground",
          className
        )}
        {...props}
      >
        <div className="text-sm font-medium leading-none">{title}</div>
        <p className="line-clamp-2 text-sm leading-snug text-primary-muted">
          {children}
        </p>
      </Link>
    </NavigationMenuLink>
  );
});
ListItem.displayName = "ListItem";

export function Navbar({ isInverted }: { isInverted?: boolean }) {
  const { data, isLoading, isError } = trpc.user.getUserData.useQuery();
  const { data: starsCount, isLoading: isStarsLoading } =
    trpc.misc.getStars.useQuery();

  return (
    <nav className="container relative flex items-center justify-between border-b border-b-accent-background px-6 py-6 md:px-16">
      <div className="flex items-center space-x-4">
        <Link href="/" className="mr-12 hover:bg-primary-hover">
          <Logo />
        </Link>

        <NavigationMenu>
          <NavigationMenuList>
            {NAV_ITEMS.map(({ href, title, subItems }) => (
              <NavigationMenuItem>
                {subItems == null ? (
                  <Link href={href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      {title}
                    </NavigationMenuLink>
                  </Link>
                ) : (
                  <>
                    <NavigationMenuTrigger>{title}</NavigationMenuTrigger>
                    <NavigationMenuContent className="min-w-[400px]">
                      {subItems.map(({ href, title, subTitle }) => (
                        <ListItem href={href} title={title}>
                          {subTitle}
                        </ListItem>
                      ))}
                    </NavigationMenuContent>
                  </>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <div className="flex items-center space-x-3">
        <Link
          href="https://github.com/tryabby/abby"
          className="flex h-full items-center justify-center space-x-2 rounded-lg border-2 border-primary-foreground px-4 py-2 font-medium transition-colors duration-200 ease-out hover:bg-pink-300/50"
        >
          <Star className="h-5 w-5" />
          <span>{isStarsLoading ? "0" : `${starsCount}`}</span>
        </Link>
        {!isLoading && !isError ? (
          <NavItem
            href={`/projects/${data.projects[0]?.id}`}
            isProminent
            className="hidden lg:flex"
          >
            Dashboard
          </NavItem>
        ) : (
          <NavItem isProminent href="/login" className="hidden lg:flex">
            Log In
          </NavItem>
        )}
        <MobileNav isInverted={isInverted} />
      </div>
    </nav>
  );
}
