import { signOut, useSession } from "next-auth/react";
import { Avatar } from "./Avatar";

const UserInfo = () => {
  const { data: sessionData } = useSession();

  return (
    <div className="items-left flex space-x-2">
      <Avatar
        imageUrl={sessionData?.user?.image}
        userName={sessionData?.user?.name!}
      />
      <div className="flex flex-col items-start justify-center font-bold">
        <span className="">{sessionData?.user?.name}</span>
        <button
          className="text-pink-500"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export { UserInfo };
