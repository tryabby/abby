import dayjs from "dayjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { PLANS } from "server/common/plans";
import { prisma } from "server/db/client";
import { RequestCache } from "server/services/RequestCache";
import { z } from "zod";

const incomingQuerySchema = z.object({
  secretKey: z.literal("yfMWV3TC0xyLvEKoHjslTp8GeKFEFRDtfVckg3Y2LHA="),
});

export default async function invalidateProjectLimitsHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { success } = await incomingQuerySchema.spa(req.query);

  if (!success) {
    // fail silently
    console.warn("Invalid request to invalidate project limits");
    return res.status(200);
  }

  const nonStripeProjectsToUpdate = await prisma.project.findMany({
    where: {
      OR: [
        { stripePriceId: { equals: null } },
        { stripePriceId: { equals: PLANS.BETA } },
        { stripePriceId: { equals: PLANS.STARTUP_LIFETIME } },
      ],
      currentPeriodEnd: {
        lte: new Date(),
      },
    },
  });

  if (nonStripeProjectsToUpdate.length === 0) {
    console.info("No projects to update");
    return res.end();
  }

  console.info(
    `Updating plan for ${nonStripeProjectsToUpdate.length} projects`
  );

  await prisma.project.updateMany({
    where: {
      id: {
        in: nonStripeProjectsToUpdate.map((p) => p.id),
      },
    },
    data: {
      currentPeriodEnd: dayjs().add(30, "days").toISOString(),
    },
  });

  await RequestCache.reset(nonStripeProjectsToUpdate.map((p) => p.id));

  res.end();
}
