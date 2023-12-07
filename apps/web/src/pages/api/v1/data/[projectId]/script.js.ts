import { trackPlanOverage } from "lib/logsnag";
import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";
import { EventService } from "server/services/EventService";
import { RequestCache } from "server/services/RequestCache";
import { RequestService } from "server/services/RequestService";
import { getAbbyResponseWithCache, incomingQuerySchema } from ".";
import { ABBY_WINDOW_KEY } from "@tryabby/core";

export default async function getScriptHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const now = performance.now();

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

  const { events, planLimits, plan, is80PercentOfLimit } =
    await EventService.getEventsForCurrentPeriod(projectId);

  if (events > planLimits.eventsPerMonth) {
    res.status(429).json({ error: "Plan limit reached" });
    // TODO: send email
    // TODO: send email if 80% of limit reached
    await trackPlanOverage(projectId, plan);
    return;
  }

  try {
    const response = await getAbbyResponseWithCache({ projectId, environment });

    const jsContent = `window.${ABBY_WINDOW_KEY} = ${JSON.stringify(response)}`;

    res.setHeader("Content-Type", "application/javascript");

    res.send(jsContent);

    if (is80PercentOfLimit) {
      await trackPlanOverage(projectId, plan, is80PercentOfLimit);
    }

    await RequestCache.increment(projectId);

    const duration = performance.now() - now;

    RequestService.storeRequest({
      projectId,
      type: "GET_CONFIG_SCRIPT",
      durationInMs: duration,
      apiVersion: "V1",
    }).catch((e) => {
      console.error("Unable to store request", e);
    });

    return;
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
}
