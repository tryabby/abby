import { env } from "env/server.mjs";
import type { Context, MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { GetServerSidePropsContext } from "next";
import type { DefaultSession } from "next-auth";
import { decode } from "next-auth/jwt";
import { getServerAuthSession } from "server/common/get-server-auth-session";
import type { UserSession } from "types/next-auth";

export async function getHonoSession(c: Context) {
  return await getServerAuthSession({
    req: {
      ...c.req.raw.clone(),
      cookies: getCookie(c),
    } as unknown as GetServerSidePropsContext["req"],
    res: {
      ...c.res,
      getHeader: (h: string) => c.req.header(h),
      setHeader: (h: string, v: string) => c.header(h, v),
    } as unknown as GetServerSidePropsContext["res"],
  });
}

export const authMiddleware: MiddlewareHandler<{
  Variables: {
    user: UserSession & DefaultSession["user"];
  };
}> = async (c, next) => {
  const tokenCookie = getCookie(c, "next-auth.session-token");
  if (!tokenCookie) return next();
  if (!env.NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }
  const session = await decode({
    secret: env.NEXTAUTH_SECRET,
    token: tokenCookie,
  });
  if (!session || !session.user) {
    return c.json({ error: "Unauthorized" }, { status: 401 });
  }
  c.set("user", session.user);
  return next();
};
