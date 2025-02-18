import { type Option, ROLE } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { PLANS, planNameSchema } from "server/common/plans";
import { stripe } from "server/common/stripe";
import { prisma } from "server/db/client";
import { EventService } from "server/services/EventService";
import { ProjectService } from "server/services/ProjectService";
import { generateCodeSnippets } from "utils/snippets";
import { z } from "zod";

export type ClientOption = Omit<Option, "chance"> & {
  chance: number;
};
import { AbbyEventType } from "@tryabby/core";
import dayjs from "dayjs";
import { assertUserHasAcessToProject } from "server/common/auth";
import {
  getAllRepositoriesForInstallation,
  getGithubApp,
} from "server/common/github-app";
import { githubIntegrationSettingsSchema } from "server/common/integrations";
import { match } from "ts-pattern";
import { updateProjectsOnSession } from "utils/updateSession";
import { protectedProcedure, router } from "../trpc";

export const projectRouter = router({
  getProjectData: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          users: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          tests: {
            include: {
              options: true,
            },
          },
          userSegments: true,
          environments: true,
          featureFlags: true,
          users: { include: { user: true } },
          integrations: true,
        },
      });

      if (!project) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const { events: eventsThisPeriod } =
        await EventService.getEventsForCurrentPeriod(project.id);

      const events = await ctx.prisma.event.groupBy({
        by: ["selectedVariant", "type", "testId"],
        _count: { _all: true },
        where: {
          testId: { in: project.tests.map((test) => test.id) },
          createdAt: {
            gte: dayjs().subtract(30, "days").toDate(),
          },
        },
      });

      return {
        project: {
          ...project,
          eventsThisPeriod,
          tests: project.tests.map((test) => {
            const actEvents: typeof events = [];
            const pingEvents: typeof events = [];
            for (const event of events) {
              if (event.testId === test.id) {
                if (event.type === AbbyEventType.ACT) {
                  actEvents.push(event);
                } else {
                  pingEvents.push(event);
                }
              }
            }
            return {
              ...test,

              actEvents,
              pingEvents,
              options: test.options.map((option) => ({
                ...option,
                chance: option.chance.toNumber(),
              })),
            };
          }),
        },
      };
    }),
  getCodeSnippet: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectData = await ctx.prisma.project.findUnique({
        where: {
          id: input.projectId,
        },
        include: {
          tests: {
            include: {
              options: true,
            },
          },
          featureFlags: true,
        },
      });

      if (!projectData) throw new TRPCError({ code: "NOT_FOUND" });

      return generateCodeSnippets({
        projectId: input.projectId,
        tests: projectData.tests,
        flags: projectData.featureFlags,
      });
    }),
  createStripeCheckoutSession: protectedProcedure
    .input(z.object({ projectId: z.string(), plan: planNameSchema }))
    .mutation(async ({ ctx, input: { plan, projectId } }) => {
      const priceId = PLANS[plan];

      const project = await ctx.prisma.project.findFirst({
        where: {
          id: projectId,
          users: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      // checkout.sessions.create can only be called with *either* a customer ID (if it exists) *or* a customer_email (if no ID exists yet)
      const customerMetadata = project.stripeCustomerId
        ? {
            customer: project.stripeCustomerId,
          }
        : {
            // biome-ignore lint/style/noNonNullAssertion:>
            customer_email: ctx.session.user.email!,
          };

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          projectId,
          userId: ctx.session.user.id,
        },
        allow_promotion_codes: true,
        ...customerMetadata,
        billing_address_collection: "auto",
        success_url: `${ctx.origin}/projects/${project.id}/?upgraded=true`,
        cancel_url: `${ctx.origin}/projects/${project.id}`,
      });

      return session.id;
    }),
  createStripeBillingPortalUrl: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input: { projectId } }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          users: {
            some: {
              userId: ctx.session.user.id,
            },
          },
          id: projectId,
        },
      });

      if (!project || !project.stripeCustomerId) return null;

      const { url } = await stripe.billingPortal.sessions.create({
        customer: project.stripeCustomerId,
        return_url: `${ctx.origin}/projects/${project.id}/settings`,
      });

      return url;
    }),
  updateName: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.update({
        where: {
          id: input.projectId,
        },
        data: {
          name: input.name,
        },
      });
      return project;
    }),
  removeUser: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.projectInvite.deleteMany({
        where: {
          projectId: input.projectId,
          userId: input.userId,
        },
      });
      await ctx.prisma.projectUser.delete({
        where: {
          userId_projectId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
      });
    }),
  deleteProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const projectId = input.projectId;

      const project = await ctx.prisma.project.findFirst({
        where: {
          id: projectId,
          users: {
            some: {
              userId: ctx.session.user.id,
              role: ROLE.ADMIN,
            },
          },
        },
      });

      if (!project) throw new TRPCError({ code: "UNAUTHORIZED" });

      await ctx.prisma.project.delete({
        where: {
          id: projectId,
        },
      });
    }),
  createProject: protectedProcedure
    .input(z.object({ projectName: z.string().min(3) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const project = await ProjectService.createProject({
        projectName: input.projectName,
        userId,
      });
      await updateProjectsOnSession(ctx, project.id);
      return project;
    }),
  getEventLogs: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const cursor = input.cursor;
      const limit = input.limit ?? 50;
      const logItems = await ctx.prisma.featureFlagHistory.findMany({
        take: limit + 1,
        where: {
          flagValue: {
            flag: {
              project: {
                id: input.projectId,
                users: {
                  some: {
                    userId: ctx.session.user.id,
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: true,
          flagValue: {
            include: {
              flag: { select: { name: true } },
              environment: { select: { name: true } },
            },
          },
        },
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (logItems.length > limit) {
        const nextItem = logItems.pop();
        nextCursor = nextItem?.id;
      }
      return {
        items: logItems,
        nextCursor,
      };
    }),
  getIntegrations: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      await assertUserHasAcessToProject(input.projectId, ctx.session.user.id);

      const project = await prisma.project.findUniqueOrThrow({
        where: { id: input.projectId },
        include: { integrations: true },
      });

      return await Promise.all(
        project.integrations.map((i) =>
          match(i.type)
            .with("GITHUB", async () => {
              const integration =
                await githubIntegrationSettingsSchema.parseAsync(i.settings);

              const gh = await getGithubApp().getInstallationOctokit(
                integration.installationId
              );
              const [potentialRepositories, ...installedRepos] =
                await Promise.all([
                  getAllRepositoriesForInstallation(integration.installationId),
                  ...integration.repositoryIds.map((id) =>
                    gh.request("GET /repositories/:id", {
                      id,
                    })
                  ),
                ]);

              return {
                ...i,
                settings: integration,
                potentialRepositories: potentialRepositories.map((r) => ({
                  name: r.name,
                  owner: r.owner.login,
                  id: r.id,
                })),
                installedRepos: installedRepos.map((r) => ({
                  name: r.data.name,
                  owner: r.data.owner.login,
                  id: r.data.id,
                })),
              };
            })
            .exhaustive()
        )
      );
    }),
  updateGithubIntegration: protectedProcedure
    .input(
      z.object({
        integrationId: z.string(),
        repositoryId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const integration = await prisma.integration.findUnique({
        where: {
          id: input.integrationId,
        },
        include: { project: { include: { users: true } } },
      });
      if (!integration) throw new TRPCError({ code: "NOT_FOUND" });
      if (integration.type !== "GITHUB") {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      if (
        !integration.project.users.some((u) => u.userId === ctx.session.user.id)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const newSettings = await githubIntegrationSettingsSchema.parseAsync(
        integration.settings
      );
      newSettings.repositoryIds = [input.repositoryId];

      return await prisma.integration.update({
        where: {
          id: input.integrationId,
        },
        data: {
          settings:
            await githubIntegrationSettingsSchema.parseAsync(newSettings),
        },
      });
    }),
});
