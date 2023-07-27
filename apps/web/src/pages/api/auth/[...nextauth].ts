import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { env } from "../../../env/server.mjs";
import { prisma } from "../../../server/db/client";
import { trackSignup } from "lib/logsnag";
import { ProjectService } from "../../../server/services/ProjectService";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Include user.id on session
    session({ session, token }) {
      if (token.user) {
        session.user = {
          ...session.user,
          id: token.user.id,
          image: token.user.image,
          projectIds: token.user.projectIds,
          lastOpenProjectId: session.user?.lastOpenProjectId
            ? session.user?.lastOpenProjectId
            : token.user.projectIds[0],
        };
      }

      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        if ("lastOpenProjectId" in session) {
          token.user.lastOpenProjectId = session.lastOpenProjectId;
        }
        if ("projectIds" in session) {
          token.user.projectIds = session.projectIds;
        }
      }
      if (user) {
        const projects = await prisma.projectUser.findMany({
          where: {
            userId: user.id,
          },
          select: {
            projectId: true,
          },
        });
        token.user = {
          ...(token.user ?? {}),
          id: user.id,
          image:
            user.image ??
            `https://avatars.dicebear.com/api/initials/${user?.email}.svg`,
          projectIds: projects.map((project) => project.projectId),
        };
      }

      return token;
    },
  },
  events: {
    async createUser({ user }) {
      await ProjectService.createProject({
        userId: user.id,
        projectName: "My Project",
      });
      await trackSignup();
    },
  },
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: env.GITHUB_ID,
      clientSecret: env.GITHUB_SECRET,
    }),
    EmailProvider({
      from: `A/BBY <${env.ABBY_FROM_EMAIL}>`,
      server: env.EMAIL_SERVER,
    }),
    // conditionally add Google provider if client ID and secret are set
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // ...add more providers here
  ],
};

export default NextAuth(authOptions);
