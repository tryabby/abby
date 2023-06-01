import { IStorageService, getABStorageKey } from "@tryabby/core";
import { parseCookies } from "./helpers.ts";
import { getRequest } from "./contexts/requestContext.ts";
import { getResponse } from "./contexts/responseContext.ts";

class ABStorageService implements IStorageService {
    get(projectId: string, key: string): string | null {
        const req = getRequest();
        if (!req) return null;
        const cookieMap = parseCookies(req);
        const cookieKey = getABStorageKey(projectId, key);
        const cookieValue = cookieMap.get(cookieKey)
        return cookieValue ?? null;
    }
    set(projectId: string, key: string, value: string): void {
        const response = getResponse();
        if (!response) throw new Error("no response object")
        const cookieKey = getABStorageKey(projectId, key);
        response.cookie(cookieKey, value)
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