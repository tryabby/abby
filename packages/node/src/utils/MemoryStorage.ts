import type { IStorageService } from "@tryabby/core";

export class InMemoryStorageService implements IStorageService {
  cache: Map<string, string>;
  constructor() {
    this.cache = new Map();
  }
  get(key: string): string | null {
    return this.cache.get(key) ?? null;
  }
  set(key: string, value: string): void {
    this.cache.set(key, value);
  }
  remove(key: string): void {
    this.cache.delete(key);
  }
}
