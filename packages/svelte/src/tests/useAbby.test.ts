import { AbbyEventType, HttpService } from "@tryabby/core";
/// @ts-ignore it doesn't have types
import { get } from "svelte/store";
import { describe, expect, it, vi } from "vitest";
import { TestStorageService } from "../lib/StorageService";
import { createAbby } from "../lib/createAbby";

const _OLD_ENV = process.env;

describe("useAbby working", () => {
  it("returns a valid variant", () => {
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
        test2: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
    });
    const result = useAbby("test");
    expect(result.variant).toBeDefined();
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
    const result = get(variant);
    // the stored value should not be overwritten
    expect(setSpy).not.toHaveBeenCalled();
    //the stored value should be accessed
    expect(getSpy).toBeCalled();
    // value set in localstorage
    expect(result).toEqual(persistedValue);
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
    const result = get(variant);
    expect(result).toBe("a");
  });

  it("should ping the current info on mount", () => {
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

    //onAct();
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
      expect.objectContaining({ type: AbbyEventType.PING })
    );
  });

  it("returns the correct possible variant values", async () => {
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
    const recievedVariants = get(getVariants("test"));
    expect(recievedVariants).toEqual(expectedVariants);
  });

  it("uses lookup object when retrieving variant", async () => {
    const { getABTestValue } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        lookupTest: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
    });

    const pickedVariant = getABTestValue("lookupTest");
    const lookupMap = {
      SimonsText: 1,
      MatthiasText: 2,
      TomsText: 3,
      TimsText: 4,
    };

    const value = getABTestValue("lookupTest", lookupMap);
    expect(value).toBe(lookupMap[pickedVariant]);
  });
});
