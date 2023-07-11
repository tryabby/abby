import { IStorageService, getABStorageKey } from "@tryabby/core";
import { parseCookies } from "./helpers";
import { getRequest } from "../abby/contexts/requestContext";
import { getResponse } from "../abby/contexts/responseContext";
import { FastifyReply } from "fastify";

class ABStorageService implements IStorageService {
  get(projectId: string, key: string): string | null {
    const req = getRequest();
    if (!req) return null;
    const cookieMap = parseCookies(req);
    const cookieKey = getABStorageKey(projectId, key);
    const cookieValue = cookieMap.get(cookieKey);
    return cookieValue ?? null;
  }
  set(projectId: string, key: string, value: string): void {
    const response = getResponse();
    if (!response) {
      console.log("return;");
      return;
    }
    const cookieKey = getABStorageKey(projectId, key);
    console.log("cookie Service");
    response.cookie(cookieKey, value); //TODO find a way to handle fastify and express cookies
  }
  remove(projectId: string, key: string): void {
    throw new Error("Method not implemented.");
  }
}

class FFStorageService implements IStorageService {
  get(projectId: string, key: string): string | null {
    throw new Error("Method not implemented.");
  }
  set(projectId: string, key: string, value: string): void {
    throw new Error("Method not implemented.");
  }
  remove(projectId: string, key: string): void {
    throw new Error("Method not implemented.");
  }
}

export const TestStorageService = new ABStorageService();
export const FlagStorageService = new FFStorageService();
