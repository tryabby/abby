import { FeatureFlagType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { getProjectPaidPlan } from "lib/stripe";
import { ConfigCache } from "server/common/config-cache";
import { getLimitByPlan } from "server/common/plans";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const environmentRouter = router({
  addEnvironment: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
          environments: true,
        },
      });

      if (!project) throw new TRPCError({ code: "UNAUTHORIZED" });

      const limits = getLimitByPlan(getProjectPaidPlan(project));

      if (project.environments.length >= limits.environments) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You have reached the limit of ${limits.environments} environments for your plan.`,
        });
      }

      const [newEnv, featureFlags] = await Promise.all([
        ctx.prisma.environment.create({
          data: {
            name: input.name,
            projectId: input.projectId,
            sortIndex: project.environments.length,
          },
        }),
        ctx.prisma.featureFlag.findMany({
          where: {
            projectId: input.projectId,
          },
        }),
      ]);

      await ctx.prisma.$transaction(async (tx) => {
        const newFlagValues = await Promise.all(
          featureFlags.map((flag) =>
            tx.featureFlagValue.create({
              data: {
                flagId: flag.id,
                environmentId: newEnv.id,
                value:
                  flag.type === FeatureFlagType.BOOLEAN
                    ? "false"
                    : flag.type === FeatureFlagType.STRING
                      ? "new value"
                      : "0",
              },
            })
          )
        );
        return tx.featureFlagHistory.createMany({
          data: newFlagValues.map((flag) => ({
            userId: ctx.session.user.id,
            newValue: "false",
            flagValueId: flag.id,
            oldValue: null,
          })),
        });
      });
    }),
  updateName: protectedProcedure
    .input(z.object({ name: z.string(), environmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const env = await ctx.prisma.environment.findFirst({
        where: {
          id: input.environmentId,
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });

      if (!env) throw new TRPCError({ code: "UNAUTHORIZED" });
      ConfigCache.deleteConfig({
        environment: env.name,
        projectId: env.projectId,
      });
      return ctx.prisma.environment.update({
        where: {
          id: input.environmentId,
        },
        data: {
          name: input.name,
        },
      });
    }),
  deleteEnvironment: protectedProcedure
    .input(z.object({ environmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const env = await ctx.prisma.environment.findFirst({
        where: {
          id: input.environmentId,
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });

      if (!env) throw new TRPCError({ code: "UNAUTHORIZED" });

      ConfigCache.deleteConfig({
        environment: env.name,
        projectId: env.projectId,
      });
      // delete all environment
      await ctx.prisma.environment.delete({
        where: {
          id: input.environmentId,
        },
      });
    }),
  updateEnvironmentSort: protectedProcedure
    .input(
      z.object({
        environments: z.array(
          z.object({
            id: z.string(),
            sortIndex: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const env = await ctx.prisma.environment.findFirst({
        where: {
          id: { in: input.environments.map((env) => env.id) },
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });

      if (!env) throw new TRPCError({ code: "UNAUTHORIZED" });

      await ctx.prisma.$transaction(
        input.environments.map((env) =>
          ctx.prisma.environment.update({
            where: {
              id: env.id,
            },
            data: {
              sortIndex: env.sortIndex,
            },
          })
        )
      );
    }),
});
