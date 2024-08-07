import type { GetServerSideProps, NextPage } from "next";
import { getSession, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { prisma } from "../../server/db/client";

import Link from "next/link";
import { trpc } from "utils/trpc";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getSession(ctx);

  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email ?? "" },
  });

  // no logged in user, required to accept invite
  if (!user || !user.email)
    return { props: {}, redirect: { destination: "/" } };

  //  TODO: check if user is already in project or invite is expired
  const invite = await prisma.projectInvite.findFirst({
    where: { id: ctx.params?.inviteId as string, email: user.email },
    include: { project: true },
  });

  if (!invite) {
    return {
      props: {},
      redirect: {
        destination: "/",
      },
    };
  }

  return {
    props: {},
  };
};

const Projects: NextPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { inviteId } = router.query;

  const { data, isLoading } = trpc.invite.getInviteData.useQuery({
    inviteId: inviteId as string,
  });

  const projectInviteMutation = trpc.invite.acceptInvite.useMutation();

  const acceptInvite = async () => {
    await projectInviteMutation.mutateAsync({
      inviteId: inviteId as string,
    });

    router.push(`/projects/${data?.project?.id}`);
  };

  if (isLoading || !session) return null;

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-pink-100">
      <div className="max-w-2xl rounded-md bg-white p-8 text-gray-900 shadow-2xl">
        <div className="mb-12 flex justify-center">
          <img
            src={session.user?.image}
            className="h-24 w-24 rounded-full"
            alt=""
          />
        </div>
        <div className="text-center text-lg">
          <h2>You have been invited to</h2>
          <p className="my-3 text-xl font-bold">{data?.project?.name}</p>
          <button
            type="button"
            className="rounded-lg bg-gray-900 px-3 py-2 font-semibold text-white transition-transform duration-150 ease-in-out hover:scale-110"
            onClick={acceptInvite}
          >
            Accept Invitation
          </button>
          <p className="my-4 text-sm">or</p>
          <Link href="/projects" className="block text-sm text-gray-500">
            Go back to projects
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Projects;
