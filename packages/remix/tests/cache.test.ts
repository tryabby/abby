import { PromiseCache } from "../src/cache";

describe("PromiseCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should cache the result of a function", async () => {
    const cache = new PromiseCache();
    const fn = vi.fn(async () => 1);
    let result = await cache.get("test", fn);
    expect(result).toBe(1);

    // The function should not be called again
    result = await cache.get("test", fn);
    expect(result).toBe(1);

    result = await cache.get("test", fn);
    expect(result).toBe(1);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should not cache the result of a function if the ttl has expired", async () => {
    const cache = new PromiseCache(1000);
    const fn = vi.fn(async () => 1);
    let result = await cache.get("test", fn);
    expect(result).toBe(1);

    // The function should not be called again
    result = await cache.get("test", fn);
    expect(result).toBe(1);

    // Fast forward 1 second
    vi.advanceTimersByTime(1001);

    result = await cache.get("test", fn);
    expect(result).toBe(1);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
