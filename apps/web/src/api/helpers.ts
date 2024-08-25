import type { Context, MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { GetServerSidePropsContext } from "next";
import type { DefaultSession } from "next-auth";
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
  const session = await getHonoSession(c);
  if (!session || !session.user) {
    return c.json({ error: "Unauthorized" }, { status: 401 });
  }
  c.set("user", session.user);
  return next();
};
