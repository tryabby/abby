import { describe, expect, it, vi, beforeEach, afterAll, assertType } from "vitest";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";
import { HttpService, AbbyEventType } from "@tryabby/core";

const OLD_ENV = process.env;

beforeEach(() => {
  vi.restoreAllMocks();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("@tryabby/vue integration", () => {
  it("useAbby returns selected variant and onAct callback", () => {
    const setSpy = vi.spyOn(TestStorageService, "set");
    const sendSpy = vi.spyOn(HttpService, "sendData").mockImplementation(() => Promise.resolve());

    const { useAbby } = createAbby({
      environments: ["production"],
      currentEnvironment: "production",
      projectId: "proj_vue_123",
      tests: {
        heroBanner: { variants: ["Control", "VariantB"] },
      },
    });

    const { variant, onAct } = useAbby("heroBanner");

    expect(setSpy).toHaveBeenCalled();
    expect(["Control", "VariantB"]).toContain(variant);

    onAct();
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AbbyEventType.ACT,
        data: expect.objectContaining({
          projectId: "proj_vue_123",
          testName: "heroBanner",
          selectedVariant: variant,
        }),
      })
    );
  });

  it("useAbby respects persisted variant and supports lookupObject mapping", () => {
    vi.spyOn(TestStorageService, "get").mockReturnValue("VariantB");
    const setSpy = vi.spyOn(TestStorageService, "set");
    vi.spyOn(HttpService, "sendData").mockImplementation(() => Promise.resolve());

    const { useAbby } = createAbby({
      environments: ["production"],
      currentEnvironment: "production",
      projectId: "proj_vue_123",
      tests: {
        heroBanner: { variants: ["Control", "VariantB"] as const },
      },
    });

    const { variant } = useAbby("heroBanner", {
      Control: 100,
      VariantB: 200,
    });

    expect(setSpy).not.toHaveBeenCalled();
    expect(variant).toBe(200);
  });

  it("useFeatureFlag and useFeatureFlags return strongly typed flag values", () => {
    const { useFeatureFlag, useFeatureFlags, __abby__ } = createAbby({
      environments: ["production"],
      currentEnvironment: "production",
      projectId: "proj_vue_123",
      flags: ["darkMode", "betaCheckout"],
    });

    __abby__.init({
      flags: [
        { name: "darkMode", value: true },
        { name: "betaCheckout", value: false },
      ],
      tests: [],
      remoteConfig: [],
    });

    expect(useFeatureFlag("darkMode")).toBe(true);
    expect(useFeatureFlag("betaCheckout")).toBe(false);
    expect(useFeatureFlags()).toEqual([
      { name: "darkMode", value: true },
      { name: "betaCheckout", value: false },
    ]);
  });

  it("useRemoteConfig returns typed remote config values (String, Number, Boolean, JSON)", () => {
    const { useRemoteConfig, useRemoteConfigVariables, __abby__ } = createAbby({
      environments: ["production"],
      currentEnvironment: "production",
      projectId: "proj_vue_123",
      remoteConfig: {
        welcomeMessage: "String",
        maxRetries: "Number",
        enablePromo: "Boolean",
      },
    });

    __abby__.init({
      flags: [],
      tests: [],
      remoteConfig: [
        { name: "welcomeMessage", value: "Hello Vue!" },
        { name: "maxRetries", value: 5 },
        { name: "enablePromo", value: true },
      ],
    });

    const msg = useRemoteConfig("welcomeMessage");
    const retries = useRemoteConfig("maxRetries");
    const promo = useRemoteConfig("enablePromo");

    expect(msg).toBe("Hello Vue!");
    expect(retries).toBe(5);
    expect(promo).toBe(true);
    expect(useRemoteConfigVariables()).toHaveLength(3);
  });

  it("provides strict TypeScript type inference matching @tryabby/react", () => {
    const variants = ["Alpha", "Beta", "Gamma"] as const;
    const { useAbby, useFeatureFlag, useRemoteConfig } = createAbby({
      environments: ["dev"],
      currentEnvironment: "dev",
      projectId: "proj_types",
      flags: ["newNav"],
      tests: {
        single: { variants: ["ONLY_ONE"] },
        multi: { variants },
      },
      remoteConfig: {
        strKey: "String",
        numKey: "Number",
        boolKey: "Boolean",
      },
    });

    const resSingle = useAbby("single");
    assertType<"ONLY_ONE">(resSingle.variant);

    const resMulti = useAbby("multi");
    assertType<"Alpha" | "Beta" | "Gamma">(resMulti.variant);

    const resMapped = useAbby("multi", {
      Alpha: { id: 1 },
      Beta: { id: 2 },
      Gamma: { id: 3 },
    });
    assertType<{ id: number }>(resMapped.variant);

    const flagVal = useFeatureFlag("newNav");
    assertType<boolean>(flagVal);

    assertType<string>(useRemoteConfig("strKey"));
    assertType<number>(useRemoteConfig("numKey"));
    assertType<boolean>(useRemoteConfig("boolKey"));
  });
});
