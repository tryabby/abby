import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { hashApiKey } from "utils/apiKey";

export const apiKeyRouter = router({
  createApiKey: protectedProcedure
    .input(
      z.object({
        apiKey: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = input.apiKey;
      // const hashedApiKey = hashApiKey(apiKey); // TODO use package for hashing

      const apiKeyEntry = await ctx.prisma.aPIKey.create({
        data: {
          hashedKey: apiKey,
          name: input.name,
          validDays: 365,
          userId: ctx.session.user.id,
        },
      });
    }),
});
