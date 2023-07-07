import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { hashApiKey } from "utils/apiKey";

export const apiKeyRouter = router({
  createApiKey: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        apiKey: z.string(),
        validDays: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = input.apiKey;
      const hashedApiKey = hashApiKey(apiKey);

      const apiKeyEntry = await ctx.prisma.aPIKey.create({
        data: {
          hashedKey: hashedApiKey,
          name: input.name,
          validDays: input.validDays,
          userId: ctx.session.user.id,
        },
      });
    }),
  revokeApiKey: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const apiKeyEntry = await ctx.prisma.aPIKey.update({
        where: {
          id: input.id,
        },
        data: {
          isRevoked: true,
        },
      });
    }),
});
