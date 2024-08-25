import { randomUUID } from "node:crypto";
import { FeatureFlagType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { getUseFeatureFlagRegex } from "@tryabby/core";
import { env } from "env/server.mjs";
import OpenAI from "openai";
import { ConfigCache } from "server/common/config-cache";
import { githubApp } from "server/common/github-app";
import { githubIntegrationSettingsSchema } from "server/common/integrations";
import { AIFlagRemovalService } from "server/services/AiFlagRemovalService";
import { FlagService } from "server/services/FlagService";
import { validateFlag } from "utils/validateFlags";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const flagRouter = router({
  getFlags: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        types: z.array(z.nativeEnum(FeatureFlagType)),
      })
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.projectId },
        include: {
          users: { select: { userId: true } },
          integrations: { where: { type: "GITHUB" } },
        },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (!project.users.some((u) => u.userId === ctx.session.user.id)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const [flags, environments] = await Promise.all([
        ctx.prisma.featureFlag.findMany({
          where: {
            type: {
              in: input.types,
            },
            project: {
              id: input.projectId,
            },
          },
          orderBy: { createdAt: "asc" },
          include: {
            values: {
              include: {
                environment: true,
              },
            },
          },
        }),
        ctx.prisma.environment.findMany({
          where: {
            project: {
              id: input.projectId,
            },
          },
          orderBy: { sortIndex: "asc" },
        }),
      ]);
      const githubIntegration = project.integrations[0];
      const integrationSettings = githubIntegration
        ? githubIntegrationSettingsSchema.parse(githubIntegration.settings)
        : null;

      return {
        flags,
        environments,
        hasGithubIntegration:
          !!integrationSettings?.repositoryIds[0] &&
          integrationSettings?.installationId,
      };
    }),
  addFlag: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        type: z.nativeEnum(FeatureFlagType),
        value: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = input.projectId;
      const flagName = input.name;
      const userId = ctx.session.user.id;
      await FlagService.createFlag({
        projectId,
        flagName,
        userId,
        value: input.value,
        type: input.type,
      });
    }),
  updateFlag: protectedProcedure
    .input(
      z.object({
        flagValueId: z.string(),
        value: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentFlag = await ctx.prisma.featureFlagValue.findFirst({
        where: {
          id: input.flagValueId,
          flag: {
            project: {
              users: {
                some: {
                  userId: ctx.session.user.id,
                },
              },
            },
          },
        },
        include: {
          flag: { select: { type: true, projectId: true } },
          environment: { select: { name: true } },
        },
      });

      if (!currentFlag) throw new TRPCError({ code: "UNAUTHORIZED" });

      if (!validateFlag(currentFlag.flag.type, input.value)) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `The value ${input.value} is not valid for the type ${currentFlag.flag.type}`,
        });
      }

      await ctx.prisma.$transaction([
        ctx.prisma.featureFlagValue.update({
          where: {
            id: input.flagValueId,
          },
          data: {
            value: input.value,
          },
        }),
        ctx.prisma.featureFlag.update({
          where: {
            id: currentFlag.flagId,
          },
          data: {
            name: input.name,
          },
        }),
        ctx.prisma.featureFlagHistory.create({
          data: {
            userId: ctx.session.user.id,
            flagValueId: input.flagValueId,
            oldValue: currentFlag.value,
            newValue: input.value,
          },
        }),
      ]);
      ConfigCache.deleteConfig({
        environment: currentFlag.environment.name,
        projectId: currentFlag.flag.projectId,
      });
    }),
  removeFlag: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        projectId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentFlag = await ctx.prisma.featureFlag.findFirst({
        where: {
          name: input.name,
          projectId: input.projectId,
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
        include: {
          project: {
            include: { environments: { select: { name: true } } },
          },
        },
      });

      if (!currentFlag) throw new TRPCError({ code: "UNAUTHORIZED" });

      await ctx.prisma.featureFlag.deleteMany({
        where: {
          projectId: input.projectId,
          name: input.name,
        },
      });

      currentFlag.project.environments.forEach((env) =>
        ConfigCache.deleteConfig({
          environment: env.name,
          projectId: input.projectId,
        })
      );
    }),
  getHistory: protectedProcedure
    .input(
      z.object({
        flagValueId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const canReadFlag = await ctx.prisma.featureFlag.findFirst({
        where: {
          values: {
            some: {
              id: input.flagValueId,
            },
          },
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });

      if (!canReadFlag) throw new TRPCError({ code: "UNAUTHORIZED" });

      return ctx.prisma.featureFlagHistory.findMany({
        where: {
          flagValueId: input.flagValueId,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
  updateDescription: protectedProcedure
    .input(
      z.object({
        flagId: z.string(),
        description: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const flagToUpdate = await ctx.prisma.featureFlag.findFirst({
        where: {
          id: input.flagId,
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });

      if (!flagToUpdate) throw new TRPCError({ code: "UNAUTHORIZED" });

      return ctx.prisma.featureFlag.update({
        where: {
          id: flagToUpdate.id,
        },
        data: {
          description: input.description,
        },
      });
    }),
  updateFlagTitle: protectedProcedure
    .input(
      z.object({
        flagId: z.string(),
        title: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const flagToUpdate = await ctx.prisma.featureFlag.findFirst({
        where: {
          id: input.flagId,
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
        include: {
          project: {
            include: {
              environments: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (!flagToUpdate) throw new TRPCError({ code: "UNAUTHORIZED" });

      await ctx.prisma.featureFlag.update({
        where: {
          id: flagToUpdate.id,
        },
        data: {
          name: input.title,
        },
      });

      flagToUpdate.project.environments.forEach((env) =>
        ConfigCache.deleteConfig({
          environment: env.name,
          projectId: flagToUpdate.project.id,
        })
      );
    }),
  createFlagRemovalPR: protectedProcedure
    .input(
      z.object({
        flagId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const flag = await ctx.prisma.featureFlag.findUnique({
        where: { id: input.flagId },
        include: {
          project: {
            include: { users: true, integrations: true },
          },
        },
      });
      if (!flag) throw new TRPCError({ code: "NOT_FOUND" });
      const integration = flag.project.integrations.find(
        (i) => i.type === "GITHUB"
      );
      if (!integration) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      if (!flag.project.users.some((u) => u.userId === ctx.session.user.id)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const parsedIntegration = githubIntegrationSettingsSchema.parse(
        integration.settings
      );
      const gh = await githubApp.getInstallationOctokit(
        parsedIntegration.installationId
      );
      const repositoryId = parsedIntegration.repositoryIds[0];
      if (!repositoryId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }

      const repo = await gh.request("GET /repositories/:id", {
        id: repositoryId,
      });

      if (!repo) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }

      if (!env.OPENAI_API_KEY) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      const ai = new AIFlagRemovalService(
        new OpenAI({
          apiKey: env.OPENAI_API_KEY,
        })
      );

      const flagRegex = getUseFeatureFlagRegex(flag.name);
      const owner = repo.data.owner.login;
      const name = repo.data.name;
      const defaultBranch = repo.data.default_branch;

      const u = await gh.request(
        "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
        {
          owner,
          repo: name,
          tree_sha: defaultBranch,
          recursive: "1",
        }
      );

      const files = u.data.tree
        .filter((f) => f.type === "blob")
        .filter((f) => f.path?.endsWith(".ts") || f.path?.endsWith(".tsx"));

      if (files.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No files found in the repository",
        });
      }

      const fileContents = (
        await Promise.all(
          files.flatMap(async (f) => {
            if (!f.sha || !f.path) return [];
            const res = await gh.request(
              "GET /repos/{owner}/{repo}/git/blobs/{file_sha}",
              {
                owner,
                repo: name,
                file_sha: f.sha,
              }
            );
            const fileContent = Buffer.from(
              res.data.content,
              "base64"
            ).toString("utf-8");
            if (!flagRegex.test(fileContent)) return [];
            return {
              fileSha: f.sha,
              filePath: f.path,
              fileContent,
            };
          })
        )
      ).flat();
      const baseBranchResponse = await gh.rest.git.getRef({
        owner,
        repo: name,
        ref: `heads/${defaultBranch}`,
      });

      const baseSha = baseBranchResponse.data.object.sha;

      const b = await gh.rest.git.createRef({
        owner: "cstrnt",
        repo: name,
        ref: `refs/heads/abby_${randomUUID()}_remove_client_flag`,
        sha: baseSha,
      });

      await Promise.all(
        fileContents.map(async (f) => {
          const updatedCode = await ai.removeFlagFromCode(
            f.fileContent,
            flag.name
          );
          if (!updatedCode) return;
          return gh.rest.repos.createOrUpdateFileContents({
            owner,
            repo: name,
            path: f.filePath,
            message: `Remove Feature Flag: ${flag.name}`,
            content: Buffer.from(updatedCode).toString("base64"),
            sha: f.fileSha,
            branch: b.data.ref,
          });
        })
      );

      const response = await gh.rest.pulls.create({
        owner,
        repo: name,
        title: `[ABBY] Remove Feature Flag ${flag.name}`,
        head: b.data.ref,
        base: defaultBranch,
        body: `This PR was created by Abby to remove the flag ${flag.name} from the codebase. Please review the changes and merge when ready.`,
      });

      return response.data.html_url;
    }),
});
