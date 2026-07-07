import { AbbyEventType, HttpService } from "@tryabby/core";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";
import { withSetup } from "./utils";

const createTestInstance = () =>
  createAbby({
    environments: [""],
    currentEnvironment: "",
    projectId: "123",
    tests: {
      test: {
        variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
      },
      test2: { variants: ["A", "B"] },
    },
  });

describe("useAbby", () => {
  it("returns a defined variant and an onAct callback", async () => {
    const { useAbby } = createTestInstance();
    const { result } = withSetup(() => useAbby("test"));
    await flushPromises();

    expect(["SimonsText", "MatthiasText", "TomsText", "TimsText"]).toContain(
      result.variant.value
    );
    expect(typeof result.onAct).toBe("function");
  });

  it("uses the persisted variant without overwriting it", async () => {
    const persistedValue = "MatthiasText";
    const getSpy = vi
      .spyOn(TestStorageService, "get")
      .mockReturnValue(persistedValue);
    const setSpy = vi.spyOn(TestStorageService, "set");

    const { useAbby } = createTestInstance();
    const { result } = withSetup(() => useAbby("test"));
    await flushPromises();

    expect(getSpy).toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
    expect(result.variant.value).toBe(persistedValue);
  });

  it("resolves the value from a lookup object", async () => {
    vi.spyOn(TestStorageService, "get").mockReturnValue("SimonsText");

    const { useAbby } = createTestInstance();
    const { result } = withSetup(() =>
      useAbby("test", {
        SimonsText: "a",
        MatthiasText: "b",
        TomsText: "c",
        TimsText: "d",
      })
    );
    await flushPromises();

    expect(result.variant.value).toBe("a");
  });

  it("pings the server with the selected variant on mount", async () => {
    const spy = vi.spyOn(HttpService, "sendData");

    const { useAbby } = createTestInstance();
    withSetup(() => useAbby("test"));
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.PING })
    );
  });

  it("notifies the server with onAct", async () => {
    const spy = vi.spyOn(HttpService, "sendData");

    const { useAbby } = createTestInstance();
    const { result } = withSetup(() => useAbby("test"));
    await flushPromises();
    result.onAct();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });
});

describe("getABTestValue / getVariants", () => {
  it("returns all variants of a test", () => {
    const { getVariants } = createTestInstance();
    expect(getVariants("test2")).toEqual(["A", "B"]);
  });

  it("resolves the lookup value for the currently selected variant", () => {
    vi.spyOn(TestStorageService, "get").mockReturnValue("A");
    const { getABTestValue } = createTestInstance();

    expect(getABTestValue("test2", { A: 1, B: 2 })).toBe(1);
  });
});
