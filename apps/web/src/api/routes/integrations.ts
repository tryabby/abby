import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "api/helpers";
import { Hono } from "hono";
import { getGithubApp } from "server/common/github-app";
import type { GithubIntegrationSettings } from "server/common/integrations";
import { prisma } from "server/db/client";
import { z } from "zod";

export function makeIntegrationsRoute() {
  return new Hono()
    .get(
      "/github",
      zValidator(
        "query",
        z.object({
          projectId: z.string(),
        })
      ),
      authMiddleware,
      async (c) => {
        const user = c.get("user");
        const { projectId } = c.req.valid("query");
        const project = await prisma.project.findFirst({
          where: { id: projectId, users: { some: { userId: user.id } } },
          include: { integrations: true },
        });
        const referrer = new URL(c.req.header("Referer") ?? "/");

        if (!project) {
          referrer.searchParams.set("error", "Unauthorized");
          return c.redirect(referrer.toString());
        }
        if (project.integrations.some((i) => i.type === "GITHUB")) {
          referrer.searchParams.set("error", "Integration already exists");
          return c.redirect(referrer.toString());
        }

        const searchParams = new URLSearchParams();
        searchParams.set("projectId", projectId);

        return c.redirect(
          await getGithubApp().getInstallationUrl({
            state: searchParams.toString(),
          })
        );
      }
    )
    .get(
      "/github/setup",
      zValidator(
        "query",
        z.object({
          installation_id: z.string().transform(Number),
          setup_action: z.enum(["install", "update"]),
          state: z.string().transform((s) => {
            const url = new URLSearchParams(s);
            const projectId = url.get("projectId");
            if (!projectId) {
              throw new Error("projectId not found in state");
            }
            return { projectId };
          }),
        })
      ),
      async (c) => {
        const { installation_id, setup_action, state } = c.req.valid("query");
        if (setup_action === "update") {
          return c.json({ message: "Update not implemented" }, { status: 501 });
        }

        const project = await prisma.project.findFirst({
          where: { id: state.projectId },
          include: { integrations: true },
        });
        if (!project) {
          return c.json(
            { message: "Project not found" },
            {
              status: 404,
            }
          );
        }
        await prisma.integration.create({
          data: {
            type: "GITHUB",
            projectId: project.id,
            settings: {
              installationId: installation_id,
              repositoryIds: [],
            } satisfies GithubIntegrationSettings,
          },
        });
        return c.redirect(`/projects/${project.id}/settings`);
      }
    );
}
