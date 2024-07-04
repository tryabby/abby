export class PromiseCache<T> {
  private ttl: number;
  private cache: Map<string, { storedAt: number; value: Promise<T> }> = new Map();

  constructor(ttl = 1000 * 60) {
    this.ttl = ttl;
  }

  public async get(key: string, fn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.storedAt < this.ttl) {
      return cached.value;
    }

    const promise = fn();
    this.cache.set(key, { value: promise, storedAt: Date.now() });
    return promise;
  }
}
