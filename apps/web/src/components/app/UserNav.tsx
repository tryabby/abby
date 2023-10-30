import { Avatar, AvatarFallback, AvatarImage } from "components/ui/avatar";
import { Button } from "components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "components/DropdownMenu";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { DOCS_URL } from "@tryabby/core";

export function UserNav() {
  const { data } = useSession();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={data?.user?.image} alt={data?.user?.name ?? ""} />
            <AvatarFallback>{data?.user?.name?.slice(0, 2)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {data?.user?.name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {data?.user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile">API Keys</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={DOCS_URL}>Docs</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/">Home</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            signOut({
              callbackUrl: "/",
            });
          }}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
