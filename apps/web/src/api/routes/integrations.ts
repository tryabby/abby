import { zValidator } from "@hono/zod-validator";
import { Webhooks } from "@octokit/webhooks";
import { authMiddleware } from "api/helpers";
import { env } from "env/server.mjs";
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
        const referrer = new URL(c.req.header("Referer") ?? env.NEXTAUTH_URL);

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
        return c.redirect(
          `${env.NEXTAUTH_URL}/projects/${project.id}/settings`
        );
      }
    )
    .post(
      "/github/webhook",

      async (c) => {
        if (!env.GITHUB_APP_WEBHOOK_SECRET) {
          return c.json({ message: "Webhook secret not set" }, { status: 500 });
        }
        const webhooks = new Webhooks({
          secret: env.GITHUB_APP_WEBHOOK_SECRET,
        });

        webhooks.on("installation.deleted", async ({ payload }) => {
          const integration = await prisma.integration.findFirst({
            where: {
              settings: {
                path: "$.installationId",
                equals: payload.installation?.id,
              },
            },
          });

          if (!integration) return;
          await prisma.integration.delete({ where: { id: integration.id } });
        });

        await webhooks.verifyAndReceive({
          id: c.req.header("X-GitHub-Delivery") as string,
          // biome-ignore lint/suspicious/noExplicitAny: we don't care about the type here
          name: c.req.header("X-GitHub-Event") as any,
          signature: c.req.header("X-Hub-Signature-256") as string,
          payload: await c.req.text(),
        });
        return c.json({ message: "ok" });
      }
    );
}
