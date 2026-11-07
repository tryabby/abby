import { AbbyEventType, HttpService } from "@tryabby/core";
import { afterAll, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

const OLD_ENV = process.env;

beforeEach(() => {
  document.cookie = "";
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("@tryabby/vue composables", () => {
  it("selects and persists a variant via useAbby", () => {
    const spy = vi.spyOn(TestStorageService, "set");
    const { useAbby } = createAbby({
      environments: ["prod"],
      currentEnvironment: "prod",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] as const },
      },
    });

    const { variant } = useAbby("test");
    expect(spy).toHaveBeenCalled();
    expect(["OldFooter", "NewFooter"]).toContain(variant.value);
    expectTypeOf(variant.value).toEqualTypeOf<"OldFooter" | "NewFooter">();
  });

  it("maps variant values through lookupObject and emits PING and ACT events", () => {
    const getSpy = vi.spyOn(TestStorageService, "get");
    const sendSpy = vi.spyOn(HttpService, "sendData");
    getSpy.mockReturnValue("A");

    const { useAbby } = createAbby({
      environments: ["prod"],
      currentEnvironment: "prod",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B"] as const },
      },
    });

    const { variant, onAct } = useAbby("test", {
      A: "Alpha",
      B: "Beta",
    });

    expect(variant.value).toBe("Alpha");
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.PING })
    );

    onAct();
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });

  it("evaluates feature flags and remote config reactively", () => {
    process.env.NODE_ENV = "development";
    const {
      useFeatureFlag,
      useFeatureFlags,
      useRemoteConfig,
      useRemoteConfigVariables,
    } = createAbby({
      environments: ["dev"],
      currentEnvironment: "dev",
      projectId: "123",
      flags: ["flag1", "flag2"],
      remoteConfig: {
        bannerText: "String",
      },
      settings: {
        flags: {
          devOverrides: {
            flag1: true,
            flag2: false,
          },
        },
        remoteConfig: {
          devOverrides: {
            bannerText: "Welcome",
          },
        },
      },
    });

    const flag1 = useFeatureFlag("flag1");
    const flag2 = useFeatureFlag("flag2");
    const allFlags = useFeatureFlags();
    const banner = useRemoteConfig("bannerText");
    const allRemoteConfigs = useRemoteConfigVariables();

    expect(flag1.value).toBe(true);
    expect(flag2.value).toBe(false);
    expect(allFlags.value).toHaveLength(2);
    expect(banner.value).toBe("Welcome");
    expect(allRemoteConfigs.value).toHaveLength(1);
  });
});
