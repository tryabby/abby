import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "server/db/client";
import NextCors from "nextjs-cors";
import { AbbyDataResponse } from "@tryabby/core";
import { EventService } from "server/services/EventService";
import { trackPlanOverage } from "lib/logsnag";
import { RequestCache } from "server/services/RequestCache";

const incomingQuerySchema = z.object({
  projectId: z.string(),
  environment: z.string().optional(),
});

export default async function getWeightsHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await NextCors(req, res, {
    methods: ["GET"],
    origin: "*",
    optionsSuccessStatus: 200,
  });
  const querySchemaResult = incomingQuerySchema.safeParse(req.query);
  if (!querySchemaResult.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const { projectId, environment } = querySchemaResult.data;

  try {
    const { events, planLimits, plan, is80PercentOfLimit } =
      await EventService.getEventsForCurrentPeriod(projectId);

    if (events > planLimits.eventsPerMonth) {
      res.status(429).json({ error: "Plan limit reached" });
      // TODO: send email
      // TODO: send email if 80% of limit reached
      await trackPlanOverage(projectId, plan);
      return;
    }

    const [tests, flags] = await Promise.all([
      prisma.test.findMany({
        where: {
          projectId,
        },
        include: { options: true },
      }),
      prisma.featureFlagValue.findMany({
        where: {
          environment: {
            name: environment,
            projectId,
          },
        },
        include: { flag: { select: { name: true } } },
      }),
    ]);

    const response: AbbyDataResponse = {
      tests: tests.map((test) => ({
        name: test.name,
        weights: test.options.map((o) => o.chance.toNumber()),
      })),
      flags: flags.map((flagValue) => {
        return {
          name: flagValue.flag.name,
          isEnabled: flagValue.isEnabled,
        };
      }),
    };

    res.json(response);

    if (is80PercentOfLimit) {
      await trackPlanOverage(projectId, plan, is80PercentOfLimit);
    }

    await RequestCache.increment(projectId);

    return;
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
}
