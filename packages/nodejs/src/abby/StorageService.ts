import { IStorageService, getABStorageKey } from "@tryabby/core";
import { parseCookies } from "./helpers.ts";
import { getRequest, setRequest } from "./requestContext.ts";

class ABStorageService implements IStorageService {
    get(projectId: string, key: string): string | null {
        const req = getRequest();
        if (!req) return null;
        const cookieMap = parseCookies(req);
        console.log(cookieMap)
        const cookieKey = getABStorageKey(projectId, key);
        const cookieValue = cookieMap.get(cookieKey)
        console.log(cookieValue)
        return cookieValue ?? null;
    }
    set(projectId: string, key: string, value: string): void {
        throw new Error("Method not implemented.");
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