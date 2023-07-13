import { IStorageService, getABStorageKey } from "@tryabby/core";
import { parseCookies } from "./helpers";

export class ABStorageService implements IStorageService {
  get(projectId: string, key: string): string | null {
    const req = null;
    if (!req) return null;
    console.log("req.headers", req.headers);
    const cookieMap = parseCookies(req);
    console.log("cookieMap", cookieMap);
    const cookieKey = getABStorageKey(projectId, key);
    const cookieValue = cookieMap.get(cookieKey);
    console.log(cookieValue);
    return cookieValue ?? null;
  }
  set(projectId: string, key: string, value: string): void {
    const response = null;

    if (!response) return;
    const cookieKey = getABStorageKey(projectId, key);
    const cookieValue = `${cookieKey}=${value}`;

    if (response.setCookie) {
      //TODO fix typecheck
      //fastify
      response.setCookie(cookieKey, cookieValue);
    } else {
      //express
      response.cookie(cookieKey, cookieValue);
    }
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
