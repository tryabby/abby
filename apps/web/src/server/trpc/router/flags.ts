import { TRPCError } from "@trpc/server";
import { getFlagCount } from "lib/flags";
import { getProjectPaidPlan } from "lib/stripe";
import { getLimitByPlan } from "server/common/plans";
import { ProjectService } from "server/services/ProjectService";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { FeatureFlagType, Prisma } from "@prisma/client";
import { flagValue } from "@tryabby/core";

export const flagRouter = router({
  getFlags: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const flags = await ctx.prisma.featureFlag.findMany({
        where: {
          project: {
            id: input.projectId,
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
        include: {
          values: { include: { environment: true } },
        },
      });

      const environments = await ctx.prisma.environment.findMany({
        where: {
          project: {
            id: input.projectId,
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
        orderBy: { sortIndex: "asc" },
      });
      return { flags, environments };
    }),
  addFlag: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        type: z.nativeEnum(FeatureFlagType),
        value: z.string(),
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
          // to get the correct amount for the limit
          featureFlags: { distinct: ["name"] },
        },
      });

      if (!project) throw new TRPCError({ code: "UNAUTHORIZED" });

      const limits = getLimitByPlan(getProjectPaidPlan(project));

      if (getFlagCount(project.featureFlags) >= limits.flags) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You have reached the limit of ${limits.flags} flags for your plan.`,
        });
      }
      const projectEnvs = await ctx.prisma.environment.findMany({
        where: {
          projectId: input.projectId,
        },
      });

      await ctx.prisma.$transaction(async (tx) => {
        const newFlag = await tx.featureFlag.create({
          data: {
            name: input.name,
            projectId: input.projectId,
            type: input.type,
          },
        });

        const featureFlagValues = await Promise.all(
          projectEnvs.map((env) =>
            tx.featureFlagValue.create({
              data: {
                environmentId: env.id,
                flagId: newFlag.id,
                value: input.value.toString(),
              },
            })
          )
        );

        return tx.featureFlagHistory.createMany({
          data: featureFlagValues.map((featureFlag) => ({
            userId: ctx.session.user.id,
            flagValueId: featureFlag.id,
            newValue: input.value.toString(),
          })) satisfies Prisma.FeatureFlagHistoryCreateManyInput[],
        });
      });
    }),
  updateFlag: protectedProcedure
    .input(
      z.object({
        flagValueId: z.string(),
        value: flagValue,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentFlag = await ctx.prisma.featureFlagValue.findFirst({
        where: {
          id: input.flagValueId,
          flag: {
            project: {
              users: {
                some: {
                  userId: ctx.session.user.id,
                },
              },
            },
          },
        },
      });

      if (!currentFlag) throw new TRPCError({ code: "UNAUTHORIZED" });

      await ctx.prisma.featureFlagValue.update({
        where: {
          id: input.flagValueId,
        },
        data: {
          value: input.value.toString(),
        },
      });

      await ctx.prisma.featureFlagHistory.create({
        data: {
          userId: ctx.session.user.id,
          flagValueId: input.flagValueId,
          oldValue: currentFlag.value,
          newValue: input.value.toString(),
        },
      });
    }),
  removeFlag: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        projectId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const canUpdate = await ctx.prisma.featureFlag.findFirst({
        where: {
          name: input.name,
          projectId: input.projectId,
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });

      if (!canUpdate) throw new TRPCError({ code: "UNAUTHORIZED" });

      return ctx.prisma.$transaction([
        ctx.prisma.featureFlag.deleteMany({
          where: {
            projectId: input.projectId,
            name: input.name,
          },
        }),
      ]);
    }),
  getHistory: protectedProcedure
    .input(
      z.object({
        flagValueId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const canReadFlag = await ctx.prisma.featureFlag.findFirst({
        where: {
          values: {
            some: {
              id: input.flagValueId,
            },
          },
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });

      if (!canReadFlag) throw new TRPCError({ code: "UNAUTHORIZED" });

      return ctx.prisma.featureFlagHistory.findMany({
        where: {
          flagValueId: input.flagValueId,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
  updateDescription: protectedProcedure
    .input(
      z.object({
        flagId: z.string(),
        description: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const flagToUpdate = await ctx.prisma.featureFlag.findFirst({
        where: {
          id: input.flagId,
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });

      if (!flagToUpdate) throw new TRPCError({ code: "UNAUTHORIZED" });

      return ctx.prisma.featureFlag.update({
        where: {
          id: flagToUpdate.id,
        },
        data: {
          description: input.description,
        },
      });
    }),
  updateFlagTitle: protectedProcedure
    .input(
      z.object({
        flagId: z.string(),
        title: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const flagToUpdate = await ctx.prisma.featureFlag.findFirst({
        where: {
          id: input.flagId,
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });

      if (!flagToUpdate) throw new TRPCError({ code: "UNAUTHORIZED" });

      return ctx.prisma.featureFlag.update({
        where: {
          id: flagToUpdate.id,
        },
        data: {
          name: input.title,
        },
      });
    }),
});
