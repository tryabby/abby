import { ApiRequest } from "@prisma/client";
import { hashString } from "utils/apiKey";
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
