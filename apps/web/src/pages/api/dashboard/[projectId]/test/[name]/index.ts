import { type NextApiRequest, type NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "../../../../../../server/db/client";

const incomingQuerySchema = z.object({
  name: z.string(),
  projectId: z.string(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const validationResult = incomingQuerySchema.safeParse(req.query);
  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error });
  }
  const { name, projectId } = validationResult.data;
  const data = await getTestById(projectId, name);

  return res.json(data);
}

export const getTestById = async (projectId: string, testName: string) => {
  const test = await prisma.test.findUnique({
    where: {
      projectId_name: {
        projectId,
        name: testName,
      },
    },
    include: {
      options: true,
    },
  });

  return test;
};
