import { Octokit } from "octokit";

import createCacheRealm from "@databases/cache";
import { env } from "env/server.mjs";
import ms from "ms";
import { z } from "zod";
import { sendContactFormularEmail } from "../../../../emails/index";
import { publicProcedure, router } from "../trpc";

const cache = createCacheRealm({ maximumSize: 5 }).createCache({
  name: "stars",
  expireAfterMilliseconds: ms("6h"),
});

export const miscRouter = router({
  getStars: publicProcedure.query(async () => {
    if (!env.GITHUB_OAUTH_TOKEN) {
      return 0;
    }
    const cachedStars = cache.get("stars");
    if (cachedStars) {
      return cachedStars;
    }
    const octokit = new Octokit({
      auth: env.GITHUB_OAUTH_TOKEN,
    });
    const stars = await octokit.request("GET /repos/{owner}/{repo}", {
      owner: "tryabby",
      repo: "abby",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    cache.set("stars", stars.data.stargazers_count);
    return stars.data.stargazers_count;
  }),
  contactPageEmail: publicProcedure
    .input(
      z.object({
        surname: z.string(),
        name: z.string(),
        mailadress: z.string().email(),
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await sendContactFormularEmail(input);
    }),
});
