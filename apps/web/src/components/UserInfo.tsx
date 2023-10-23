import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "components/DropdownMenu";
import { LogOut, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Avatar } from "./Avatar";
import Link from "next/link";

const UserInfo = () => {
  const { data: sessionData } = useSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="hover:bg-background grid w-full grid-cols-[auto,1fr] space-x-2 rounded-md p-1 transition-colors duration-200">
          <Avatar
            imageUrl={sessionData?.user?.image}
            userName={sessionData?.user?.name!}
          />
          <div className="grid grid-cols-1 items-start text-left font-bold">
            <div>{sessionData?.user?.name}</div>
            <div
              className="truncate text-sm font-normal text-gray-400"
              title={sessionData?.user?.email ?? ""}
            >
              {sessionData?.user?.email}
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[calc(320px-5rem)] shadow-lg"
        sideOffset={12}
      >
        <DropdownMenuItem className="cursor-pointer space-x-2" asChild>
          <Link href="/profile">
            <User />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer space-x-2" asChild>
          <button onClick={() => signOut()} className="w-full">
            <LogOut />
            <span>Log Out</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { UserInfo };
