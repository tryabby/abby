import { AbbyEventType, HttpService } from "@tryabby/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TestStorageService } from "../src/StorageService";
import { createAbby } from "../src/createAbby";

const mockRandomSequence = (values: number[]) => {
  const mathRandom = vi.spyOn(Math, "random");
  for (const value of values) mathRandom.mockReturnValueOnce(value);

  if (typeof window !== "undefined" && window.crypto) {
    const remaining = [...values];
    vi.spyOn(window.crypto, "getRandomValues").mockImplementation((array) => {
      array[0] = Math.floor((remaining.shift() ?? 0) * 4294967296);
      return array;
    });
  }
};

describe("useAbby", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a valid variant and onAct", () => {
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
      },
    });
    const result = useAbby("test");
    expect(result.variant.value).toBeDefined();
    expect(result.onAct).toBeDefined();
  });

  it("should use the persistedValue", () => {
    const persistedValue = "SimonsText";
    const variants = ["SimonsText", "MatthiasText", "TomsText", "TimsText"];

    const getSpy = vi.spyOn(TestStorageService, "get");
    const setSpy = vi.spyOn(TestStorageService, "set");

    getSpy.mockReturnValue(persistedValue);
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants },
      },
    });

    const { variant } = useAbby("test");
    expect(setSpy).not.toHaveBeenCalled();
    expect(getSpy).toBeCalled();
    expect(variant.value).toEqual(persistedValue);
  });

  it("should look up the return value", () => {
    const persistedValue = "SimonsText";
    const variants = [
      "SimonsText",
      "MatthiasText",
      "TomsText",
      "TimsText",
    ] as const;

    const getSpy = vi.spyOn(TestStorageService, "get");
    getSpy.mockReturnValue(persistedValue);

    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants },
      },
    });

    const { variant } = useAbby("test", {
      SimonsText: "a",
      MatthiasText: "b",
      TomsText: "c",
      TimsText: "d",
    });
    expect(variant.value).toBe("a");
  });

  it("should ping the current info on use", () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    useAbby("test");

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.PING })
    );
  });

  it("should notify the server with onAct", () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    const { onAct } = useAbby("test");
    onAct();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });

  it("keeps the selected variant stable when computed values are not cached", () => {
    mockRandomSequence([0.1, 0.9]);
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "stable-test",
      tests: {
        test: { variants: ["A", "B"] },
      },
    });

    const { variant } = useAbby("test");

    expect(variant.value).toBe("A");
    expect(variant.value).toBe("A");
  });

  it("selects a new variant after reset", () => {
    mockRandomSequence([0.1, 0.9]);
    const { useAbby, getABResetFunction } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "reset-test",
      tests: {
        test: { variants: ["A", "B"] },
      },
    });

    const { variant } = useAbby("test");
    expect(variant.value).toBe("A");

    getABResetFunction("test")();

    expect(variant.value).toBe("B");
  });

  it("returns the correct possible variant values", () => {
    const expectedVariants: readonly string[] = [
      "SimonsText",
      "MatthiasText",
      "TomsText",
      "TimsText",
    ];
    const { getVariants } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: {
          variants: expectedVariants,
        },
      },
    });
    expect(getVariants("test").value).toEqual(expectedVariants);
  });
});

describe("useFeatureFlag", () => {
  it("returns the flag value", () => {
    const { useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1"],
    });

    expect(typeof useFeatureFlag("flag1").value).toBe("boolean");
  });
});

describe("useRemoteConfig", () => {
  it("returns the remote config value", () => {
    const { useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
    });

    expect(typeof useRemoteConfig("remoteConfig1").value).toBe("string");
  });
});
