import type { DefaultSession } from "next-auth";

type UserSession = {
  id: string;
  image: string;
  projectIds: string[];
  lastOpenProjectId: string | undefined;
  hasCompletedOnboarding: boolean;
};

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user?: UserSession & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    user: {} & UserSession;
  }
}
