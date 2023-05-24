import { TestStorageService } from "../lib/StorageService";
import { HttpService, AbbyEventType } from "@tryabby/core";
import { createAbby } from "../lib/createAbby";
import {
  it,
  describe,
  expect,
  afterEach,
  vi,
  beforeAll,
  afterAll,
} from "vitest";
/// @ts-ignore it doesn't have types
import { get } from "svelte/store";

const OLD_ENV = process.env;

describe("useAbby working", () => {
  it("returns a valid variant", () => {
    const { useAbby } = createAbby({
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
      projectId: "123",
      tests: {
        test: { variants },
      },
    });

    const { variant, onAct } = useAbby("test");
    const result = get(variant);
    // the stored value should not be overwritten
    expect(setSpy).not.toHaveBeenCalled();
    //the stored value should be accessed
    expect(getSpy).toBeCalled();
    // value set in localstorage
    expect(result).toEqual(persistedValue);
  });

  it("should ping the current info on mount", () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { useAbby } = createAbby({
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    const { variant, onAct } = useAbby("test");

    //onAct();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.PING })
    );
  });

  it("should notify the server with onAct", () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { useAbby } = createAbby({
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    const { variant, onAct } = useAbby("test");

    onAct();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.PING })
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
});
