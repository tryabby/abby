import type { NextApiRequest, NextApiResponse } from "next";
import { type Session, unstable_getServerSession } from "next-auth";
import { authOptions } from "../pages/api/auth/[...nextauth]";

const checkSession = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Session | undefined> => {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (session) {
    return session;
  }
  throw Error("Couldn't find a session.");
};

export default checkSession;
