import { Octokit } from "octokit";

import { router, publicProcedure } from "../trpc";
import { env } from "env/server.mjs";

export const miscRouter = router({
  getStars: publicProcedure.query(async ({ input }) => {
    if (!env.GITHUB_OAUTH_TOKEN) {
      return 0;
    }
    const octokit = new Octokit({
      auth: env.GITHUB_OAUTH_TOKEN,
    });
    const stars = await octokit.request(
      "GET /repos/{owner}/{repo}/stargazers",
      {
        owner: "tryabby",
        repo: "abby",
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    return stars.data.length;
  }),
});
