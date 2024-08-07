import { generateCodeSnippets } from "utils/snippets";
import { z } from "zod";

import { publicProcedure, router } from "../trpc";

export const exampleRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string().nullish() }).nullish())
    .query(({ input }) => {
      return {
        greeting: `Hello ${input?.text ?? "world"}`,
      };
    }),
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.example.findMany();
  }),
  exampleSnippet: publicProcedure.query(() => {
    return generateCodeSnippets({
      projectId: "<PROJECT_ID>",
      tests: [
        {
          name: "footer",
          options: [
            {
              identifier: "oldFooter",
            },
            {
              identifier: "newFooter",
            },
          ],
        },
        {
          name: "ctaButton",
          options: [
            {
              identifier: "dark",
            },
            {
              identifier: "light",
            },
            {
              identifier: "cyberpunk",
            },
          ],
        },
      ],
      flags: [
        {
          name: "showPrices",
          type: "BOOLEAN",
        },
        {
          name: "userLimit",
          type: "NUMBER",
        },
        {
          name: "appMode",
          type: "STRING",
        },
      ],
    });
  }),
});
