export interface IStorageService {
    get(projectId: string, key: string): string | null;
    set(projectId: string, key: string, value: string): void;
    remove(projectId: string, key: string): void;
  }