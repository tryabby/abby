import memoize from "memoize";
import { App } from "octokit";
import { env } from "../../env/server.mjs";

if (
  env.ENABLE_GITHUB_APP &&
  (!env.GITHUB_APP_ID || !env.GITHUB_APP_PRIVATE_KEY)
) {
  throw new Error("Missing required environment variables for GitHub App");
}

export const getGithubApp = () =>
  new App({
    // biome-ignore lint/style/noNonNullAssertion: we check above
    appId: env.GITHUB_APP_ID!,
    // biome-ignore lint/style/noNonNullAssertion: we check above
    privateKey: env.GITHUB_APP_PRIVATE_KEY!,
  });

const PER_PAGE = 100;
export const getAllRepositoriesForInstallation = memoize(
  async (installationId: number) => {
    const gh = await getGithubApp().getInstallationOctokit(installationId);
    let count = 0;
    const res = await gh.request("GET /installation/repositories", {
      installation_id: installationId,
      per_page: 100,
    });
    count += res.data.repositories.length;
    const repositories = res.data.repositories;

    let hasMore = res.data.total_count > count;
    while (hasMore) {
      const res = await gh.request("GET /installation/repositories", {
        installation_id: installationId,
        per_page: 100,
        page: Math.ceil(count / PER_PAGE) + 1,
      });
      count += res.data.repositories.length;
      hasMore = res.data.total_count > count;
      repositories.push(...res.data.repositories);
    }

    return repositories.toSorted((a, b) => {
      return a.full_name.localeCompare(b.full_name);
    });
  },
  {
    maxAge: 1000 * 60,
  }
);
