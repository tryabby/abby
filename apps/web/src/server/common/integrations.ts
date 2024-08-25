import { z } from "zod";

export const githubIntegrationSettingsSchema = z
  .object({
    installationId: z.number(),
    repositoryIds: z.array(z.number()),
  })
  .strict();

export type GithubIntegrationSettings = z.infer<
  typeof githubIntegrationSettingsSchema
>;
