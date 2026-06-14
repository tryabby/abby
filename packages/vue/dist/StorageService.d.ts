import { IStorageService, StorageServiceOptions } from '@tryabby/core';

declare class ABStorageService implements IStorageService {
    get(projectId: string, testName: string): string | null;
    set(projectId: string, testName: string, value: string, options?: StorageServiceOptions): void;
    remove(projectId: string, testName: string): void;
}
declare class FFStorageService implements IStorageService {
    get(projectId: string, flagName: string): string | null;
    set(projectId: string, flagName: string, value: string): void;
    remove(projectId: string, flagName: string): void;
}
declare class RCStorageService implements IStorageService {
    get(projectId: string, key: string): string | null;
    set(projectId: string, key: string, value: string): void;
    remove(projectId: string, key: string): void;
}
declare const TestStorageService: ABStorageService;
declare const FlagStorageService: FFStorageService;
declare const RemoteConfigStorageService: RCStorageService;

export { FlagStorageService, RemoteConfigStorageService, TestStorageService };
