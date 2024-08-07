import { env } from "node:process";
import { encode, getToken } from "next-auth/jwt";
import type { Context } from "server/trpc/context";

export const updateProjectsOnSession = async (
  ctx: Context,
  projectId: string
) => {
  if (!env.NEXTAUTH_SECRET) return;
  // manually add the projectId to the token
  const jwt = await getToken({ req: ctx.req, secret: env.NEXTAUTH_SECRET });
  if (!jwt) return;
  jwt.user.projectIds.push(projectId);
  const encodedJwt = await encode({
    token: jwt,
    secret: env.NEXTAUTH_SECRET,
  });

  if (env.NODE_ENV === "production") {
    ctx.res.setHeader("Set-Cookie", [
      `__Secure-next-auth.session-token=${encodedJwt}; path=/; expires=${new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toUTCString()}; httponly; secure; samesite=none`,
    ]);
  } else {
    ctx.res.setHeader("Set-Cookie", [
      `next-auth.session-token=${encodedJwt}; path=/; expires=${new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toUTCString()}; httponly`,
    ]);
  }
};
