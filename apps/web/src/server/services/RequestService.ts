import { ApiRequest } from "@prisma/client";
import { prisma } from "server/db/client";
import { AfterDataEventBatchArray } from "server/queue/AfterDataRequest";

export abstract class RequestService {
  static async storeRequest(request: AfterDataEventBatchArray) {
    await prisma.apiRequest.createMany({
      data: {
        ...request,
      },
    });
  }
}
