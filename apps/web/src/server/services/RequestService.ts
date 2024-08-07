import type { ApiRequest } from "@prisma/client";
import { prisma } from "server/db/client";

export abstract class RequestService {
  static async storeRequest(request: Omit<ApiRequest, "id" | "createdAt">) {
    await prisma.apiRequest.create({
      data: {
        ...request,
      },
    });
  }
}
