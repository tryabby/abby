import { describe, expect, it, vi } from "vitest";
import { Abby } from "../src/index";

function createClient(persistedValue: string | null, disableByDefault = false) {
  const storage = {
    get: vi.fn(() => persistedValue),
    set: vi.fn(),
  };
  const client = new Abby(
    {
      projectId: "persisted-variants-test",
      environments: ["test"],
      currentEnvironment: "test",
      cookies: { disableByDefault },
      tests: { checkout: { variants: ["control", "current"] } },
    },
    storage
  );
  client.init({
    flags: [],
    tests: [{ name: "checkout", weights: [0, 1] }],
    remoteConfig: [],
  });
  return { client, storage };
}

describe("persisted variant selection", () => {
  it("preserves a persisted variant that is still configured", () => {
    const { client, storage } = createClient("control");
    expect(client.getTestVariant("checkout")).toBe("control");
    expect(storage.set).not.toHaveBeenCalled();
  });

  it("replaces a removed persisted variant using the configured weights", () => {
    const { client, storage } = createClient("removed");
    expect(client.getTestVariant("checkout")).toBe("current");
    expect(storage.set).toHaveBeenCalledWith("checkout", "current", {
      expiresInDays: undefined,
    });
  });

  it("ignores a removed persisted variant without writing when cookies are disabled", () => {
    const { client, storage } = createClient("removed", true);
    expect(client.getTestVariant("checkout")).toBe("current");
    expect(storage.set).not.toHaveBeenCalled();
  });

  it("selects a configured variant when no persisted value exists", () => {
    const { client } = createClient(null);
    expect(client.getTestVariant("checkout")).toBe("current");
  });
});
