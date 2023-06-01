import { IStorageService } from "@tryabby/core";

class ABStorageService implements IStorageService {
    get(projectId: string, key: string): string | null {
        // throw new Error("Method not implemented.");
        return null;
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