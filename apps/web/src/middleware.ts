import { withAuth } from "next-auth/middleware";
import { NextMiddleware, NextResponse } from "next/server";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  async function middleware(req) {
    const projectId = req.nextUrl.searchParams.get("projectId");
    const pathName = req.nextUrl.pathname;

    if (pathName === "/projects" && !projectId) {
      const newUrl = new URL(req.nextUrl);
      const tokenUser = req.nextauth.token?.user;

      newUrl.pathname = `/projects/${
        tokenUser?.lastOpenProjectId ?? tokenUser?.projectIds[0]
      }`;
      return NextResponse.redirect(newUrl);
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathName = req.nextUrl.pathname;

        // basic auth check for /profile
        if (pathName.startsWith("/profile")) return token !== null;

        if (!pathName.startsWith("/projects")) return true;
        const projectId = req.nextUrl.pathname.split("/")[2];
        if (!projectId) {
          // If the path is /projects, we want to allow it.
          // because we redirect afterwards
          if (pathName === "/projects") return true;
          return false;
        }

        return token?.user.projectIds.includes(projectId) ?? false;
      },
    },
  }
) as NextMiddleware;

export const config = {
  matcher: [
    "/projects/:path*",
    "/marketing",
    "/profile",
    "/profile/generate-token",
  ],
};
