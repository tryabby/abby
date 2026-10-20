import { AbbyEventType, HttpService } from "@tryabby/core";
import Cookies from "js-cookie";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

const OLD_ENV = process.env;

beforeEach(() => {
  for (const name of Object.keys(Cookies.get())) {
    Cookies.remove(name);
  }
  process.env = { ...OLD_ENV };
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("useAbby", () => {
  it("returns variant and onAct", () => {
    const spy = vi.spyOn(TestStorageService, "set");

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

    const { variant, onAct } = useAbby("test");

    expect(spy).toHaveBeenCalled();
    expect(variant.value).toBeDefined();
    expect(["OldFooter", "NewFooter"]).toContain(variant.value);
    expect(typeof onAct).toBe("function");
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
    expect(getSpy).toHaveBeenCalled();
    expect(variant.value).toEqual(persistedValue);
  });

  it("looks up the selected variant in the lookup object", () => {
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
      SimonsText: "VariantA",
      MatthiasText: "VariantB",
      TomsText: "VariantC",
      TimsText: "VariantD",
    });

    expect(variant.value).toEqual("VariantA");
  });

  it("pings the server on initialization", () => {
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

    expect(spy).toHaveBeenCalledWith({
      url: undefined,
      type: AbbyEventType.PING,
      data: expect.objectContaining({
        projectId: "123",
        testName: "test",
      }),
    });
  });

  it("sends onAct event to server when called", () => {
    const spy = vi.spyOn(HttpService, "sendData");

    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["Variant1", "Variant2"] },
      },
    });

    const { onAct, variant } = useAbby("test");

    onAct();

    expect(spy).toHaveBeenCalledWith({
      url: undefined,
      type: AbbyEventType.ACT,
      data: {
        projectId: "123",
        selectedVariant: variant.value,
        testName: "test",
      },
    });
  });
});
