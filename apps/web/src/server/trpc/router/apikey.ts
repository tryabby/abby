import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { generateRandomString, hashApiKey } from "utils/apiKey";
import dayjs from "dayjs";

export const apiKeyRouter = router({
  createApiKey: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = generateRandomString();
      const hashedApiKey = hashApiKey(apiKey);

      await ctx.prisma.apiKey.create({
        data: {
          hashedKey: hashedApiKey,
          name: input.name,
          validUntil: dayjs().add(1, "year").toDate(),
          userId: ctx.session.user.id,
        },
      });

      return apiKey;
    }),
  revokeApiKey: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.apiKey.update({
        where: {
          id: input.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }),
});
