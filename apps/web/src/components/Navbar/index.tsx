import { Menu, Transition } from "@headlessui/react";
import { DOCS_URL } from "@tryabby/core";
import clsx from "clsx";
import Logo from "components/Logo";
import { cn } from "lib/utils";
import { Star } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Fragment } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { trpc } from "utils/trpc";

const NAV_ITEMS = [
  {
    title: "Features",
    href: "/#features",
  },
  {
    title: "Devtools",
    href: "/devtools",
  },
  {
    title: "Pricing",
    href: "/#pricing",
  },
  {
    title: "Docs",
    href: DOCS_URL,
  },
];

function MobileNav({ isInverted }: { isInverted?: boolean }) {
  const { data, status } = useSession();
  const { data: starsCount, isLoading: isStarsLoading } =
    trpc.misc.getStars.useQuery();
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
          {NAV_ITEMS.map(({ href, title }) => (
            <Menu.Item key={href}>
              {({ active }) => (
                <Link
                  className={clsx("rounded-lg p-2", active && "bg-pink-200")}
                  href={href}
                >
                  {title}
                </Link>
              )}
            </Menu.Item>
          ))}
          <Menu.Item>
            <NavItem
              href="https://github.com/tryabby/abby"
              className="mr-0"
              isInverted={isInverted}
            >
              <Star className="h-5 w-5" />
              <span>{isStarsLoading ? "0" : `${starsCount}`}</span>
            </NavItem>
          </Menu.Item>
          <Menu.Item>
            {status === "authenticated" ? (
              <NavItem
                href={`/projects/${data.user?.projectIds[0]}`}
                isProminent
                className="mr-0"
                isInverted={isInverted}
              >
                Dashboard
              </NavItem>
            ) : (
              <NavItem
                isProminent
                href="/login"
                className="mr-0"
                isInverted={isInverted}
              >
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
  isInverted?: boolean;
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
  isInverted,
}: NavItemProps) {
  return (
    <Link
      href={href ?? ""}
      onClick={onClick}
      scroll={false}
      className={clsx(
        "mr-2 flex items-center space-x-2 rounded-lg px-4 py-2 font-medium transition-colors duration-200 ease-in-out",
        className,
        isProminent
          ? isInverted
            ? "bg-pink-600 hover:bg-pink-600/70 active:bg-pink-700/70"
            : "bg-pink-300 hover:bg-pink-400/70 active:bg-pink-500/70"
          : "hover:bg-pink-300/40"
      )}
    >
      {children}
    </Link>
  );
}

export function Navbar({ isInverted }: { isInverted?: boolean }) {
  const { data, isLoading, isError } = trpc.user.getUserData.useQuery();
  const { data: starsCount, isLoading: isStarsLoading } =
    trpc.misc.getStars.useQuery();
  return (
    <nav className="container relative flex items-center justify-between px-6 py-6 md:px-16">
      <div className="flex items-center space-x-4">
        <Link href="/" className="mr-12">
          <Logo />
        </Link>
        {NAV_ITEMS.map(({ href, title }) => (
          <NavItem key={href} href={href} className="hidden lg:flex">
            {title}
          </NavItem>
        ))}
      </div>
      <div className="flex items-center space-x-3">
        <Link
          href="https://github.com/tryabby/abby"
          className="hidden h-full items-center justify-center space-x-2 rounded-lg border-2 border-pink-600 px-4 py-2 font-medium transition-colors ease-in-out hover:bg-pink-300/20 lg:flex"
        >
          <Star className="h-5 w-5" />
          <span>{isStarsLoading ? "0" : `${starsCount}`}</span>
        </Link>
        {!isLoading && !isError ? (
          <NavItem
            href={`/projects/${data.projects[0]?.id}`}
            isProminent
            isInverted={isInverted}
            className="hidden lg:flex"
          >
            Dashboard
          </NavItem>
        ) : (
          <NavItem
            isInverted={isInverted}
            isProminent
            href="/login"
            className="hidden lg:flex"
          >
            Log In
          </NavItem>
        )}
      </div>
      <MobileNav isInverted={isInverted} />
    </nav>
  );
}
