import { ApiRequest } from "@prisma/client";
import { prisma } from "server/db/client";
import { clickhouseClient } from "server/db/clickhouseClient";

export abstract class RequestService {
  static async storeRequest(request: Omit<ApiRequest, "id" | "createdAt">) {
    const {} = await Promise.all([
      await prisma.apiRequest.create({
        data: {
          ...request,
        },
      }),
      await clickhouseClient.insert({
        table: "abby.Event",
        format: "JSONEachRow",
        values: [
          {
            project_id: request.projectId,
          },
        ],
      }),
    ]);
  }
}
