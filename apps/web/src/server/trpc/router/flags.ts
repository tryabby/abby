import { TRPCError } from "@trpc/server";
import { FlagService } from "server/services/FlagService";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { FeatureFlagType } from "@prisma/client";
import { validateFlag } from "utils/validateFlags";
import { ConfigCache } from "server/common/config-cache";

export const flagRouter = router({
  getFlags: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        types: z.array(z.nativeEnum(FeatureFlagType)),
      })
    )
    .query(async ({ ctx, input }) => {
      const flags = await ctx.prisma.featureFlag.findMany({
        where: {
          type: {
            in: input.types,
          },
          project: {
            id: input.projectId,
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
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
      const projectId = input.projectId;
      const flagName = input.name;
      const userId = ctx.session.user.id;
      await FlagService.createFlag({
        projectId,
        flagName,
        userId,
        value: input.value,
        type: input.type,
      });
    }),
  updateFlag: protectedProcedure
    .input(
      z.object({
        flagValueId: z.string(),
        value: z.string(),
        name: z.string(),
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
        include: {
          flag: { select: { type: true, projectId: true } },
          environment: { select: { name: true } },
        },
      });

      if (!currentFlag) throw new TRPCError({ code: "UNAUTHORIZED" });

      if (!validateFlag(currentFlag.flag.type, input.value)) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `The value ${input.value} is not valid for the type ${currentFlag.flag.type}`,
        });
      }

      await ctx.prisma.$transaction([
        ctx.prisma.featureFlagValue.update({
          where: {
            id: input.flagValueId,
          },
          data: {
            value: input.value,
          },
        }),
        ctx.prisma.featureFlag.update({
          where: {
            id: currentFlag.flagId,
          },
          data: {
            name: input.name,
          },
        }),
        ctx.prisma.featureFlagHistory.create({
          data: {
            userId: ctx.session.user.id,
            flagValueId: input.flagValueId,
            oldValue: currentFlag.value,
            newValue: input.value,
          },
        }),
      ]);
      ConfigCache.deleteConfig({
        environment: currentFlag.environment.name,
        projectId: currentFlag.flag.projectId,
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
      const currentFlag = await ctx.prisma.featureFlag.findFirst({
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
        include: {
          project: {
            include: { environments: { select: { name: true } } },
          },
        },
      });

      if (!currentFlag) throw new TRPCError({ code: "UNAUTHORIZED" });

      await ctx.prisma.featureFlag.deleteMany({
        where: {
          projectId: input.projectId,
          name: input.name,
        },
      });

      currentFlag.project.environments.forEach((env) =>
        ConfigCache.deleteConfig({
          environment: env.name,
          projectId: input.projectId,
        })
      );
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
        include: {
          project: {
            include: {
              environments: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (!flagToUpdate) throw new TRPCError({ code: "UNAUTHORIZED" });

      await ctx.prisma.featureFlag.update({
        where: {
          id: flagToUpdate.id,
        },
        data: {
          name: input.title,
        },
      });

      flagToUpdate.project.environments.forEach((env) =>
        ConfigCache.deleteConfig({
          environment: env.name,
          projectId: flagToUpdate.project.id,
        })
      );
    }),
});
