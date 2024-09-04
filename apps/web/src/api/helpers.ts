import { env } from "env/server.mjs";
import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { Session } from "next-auth";
import { decode } from "next-auth/jwt";

export const authMiddleware: MiddlewareHandler<{
  Variables: {
    user: NonNullable<Session["user"]>;
  };
}> = async (c, next) => {
  const tokenCookie = getCookie(
    c,
    env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token"
  );
  if (!tokenCookie) {
    return c.json({ error: "Unauthorized" }, { status: 401 });
  }
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
