import { withAuth } from "next-auth/middleware";
import { NextMiddleware, NextResponse } from "next/server";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  async function middleware(req) {
    const projectId = req.nextUrl.searchParams.get("projectId");
    const pathName = req.nextUrl.pathname;

    // redirect to /welcome if user has not completed onboarding
    if (
      pathName.startsWith("/projects") &&
      req.nextauth.token?.user &&
      // required check since old sessions don't have this field
      "hasCompletedOnboarding" in req.nextauth.token.user &&
      req.nextauth.token.user.hasCompletedOnboarding === false
    ) {
      const newUrl = new URL(req.nextUrl);
      newUrl.pathname = "/welcome";
      return NextResponse.redirect(newUrl);
    }

    if (pathName === "/projects" && !projectId) {
      const newUrl = new URL(req.nextUrl);
      const tokenUser = req.nextauth.token?.user;

      newUrl.pathname = `/projects/${
        tokenUser?.lastOpenProjectId ?? tokenUser?.projectIds[0]
      }/flags`;
      return NextResponse.redirect(newUrl);
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathName = req.nextUrl.pathname;

        // onboarding needs authentification
        if (pathName === "/welcome") return token !== null;

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
    "/welcome",
  ],
};
