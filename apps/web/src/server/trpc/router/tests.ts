import { TRPCError } from "@trpc/server";
import { ProjectService } from "server/services/ProjectService";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { prisma } from "server/db/client";
import { getLimitByPlan } from "server/common/plans";
import { getProjectPaidPlan } from "lib/stripe";
import { EventService } from "server/services/EventService";
import { TestService } from "server/services/TestService";

export const testRouter = router({
  createTest: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        projectId: z.string(),
        variants: z.array(
          z.object({
            name: z.string(),
            weight: z.number().min(0).max(1),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await TestService.createTest(
        input.projectId,
        input.variants,
        input.name,
        ctx.session.user.id
      );
    }),
  updateName: protectedProcedure
    .input(
      z.object({
        testId: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // check whether the user has access to the test
      const currentTest = await prisma.test.findFirst({
        where: {
          id: input.testId,
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });
      if (!currentTest) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      await ctx.prisma.test.update({
        where: {
          id: input.testId,
        },
        data: {
          name: input.name,
        },
      });
    }),

  updateWeights: protectedProcedure
    .input(
      z.object({
        testId: z.string(),
        weights: z.array(
          z.object({
            variantId: z.string(),
            weight: z.number().min(0).max(1),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // check whether the user has access to the test
      const currentTest = await prisma.test.findFirst({
        where: {
          id: input.testId,
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });
      if (!currentTest) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await Promise.all(
        input.weights.map((w) =>
          prisma.option.update({
            where: {
              id: w.variantId,
            },
            data: {
              chance: w.weight,
            },
          })
        )
      );
    }),
  getById: protectedProcedure
    .input(
      z.object({
        testId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const currentTest = await prisma.test.findFirst({
        where: {
          id: input.testId,
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
        include: {
          options: true,
        },
      });

      if (!currentTest) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return currentTest;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        testId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const currentTest = await prisma.test.findFirst({
        where: {
          id: input.testId,
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });

      if (!currentTest) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await prisma.$transaction([
        prisma.test.delete({
          where: {
            id: input.testId,
          },
        }),
      ]);
    }),
});
