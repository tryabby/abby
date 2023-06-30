import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { hashApiKey } from "utils/apiKey";

export const apiKeyRouter = router({
  createApiKey: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        apiKey: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = input.apiKey;
      const hashedApiKey = hashApiKey(apiKey);

      const apiKeyEntry = await ctx.prisma.aPIKey.create({
        data: {
          hashedKey: hashedApiKey,
          name: input.name,
          validDays: 365,
          userId: ctx.session.user.id,
        },
      });
    }),
});
