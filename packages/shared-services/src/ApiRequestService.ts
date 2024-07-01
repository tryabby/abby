import { ApiRequest, PrismaClient } from "@tryabby/db";

export class RequestService {
  static async storeRequest(db: PrismaClient, request: Omit<ApiRequest, "id" | "createdAt">) {
    return db.apiRequest.create({
      data: {
        ...request,
      },
    });
  }
}
