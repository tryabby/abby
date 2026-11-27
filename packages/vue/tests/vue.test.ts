import { AbbyEventType, HttpService } from "@tryabby/core";
import { describe, expect, it, vi } from "vitest";
import { TestStorageService } from "../src/StorageService";
import { createAbby } from "../src/createAbby";

describe("useAbby", () => {
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
