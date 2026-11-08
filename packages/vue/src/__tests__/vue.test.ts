import { describe, it, expect, vi, beforeEach } from "vitest";
import { createApp } from "vue";
import {
  createAbby,
  useAbby,
  useFeatureFlag,
  useRemoteConfig,
  ABBY_INJECTION_KEY,
} from "../index";
import { HttpService, AbbyEventType } from "@tryabby/core";

describe("@tryabby/vue integration", () => {
  let sendDataSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    sendDataSpy = vi.spyOn(HttpService, "sendData").mockResolvedValue({} as any);
  });

  const sampleConfig = {
    projectId: "proj_test_123",
    apiUrl: "https://api.tryabby.com",
    flags: ["dark_mode", "beta_features"],
    tests: {
      button_color: {
        variants: ["blue", "green"],
      },
      hero_text: {
        variants: ["original", "variant_b"],
      },
    },
    remoteConfig: {
      discount_percentage: "Number",
      welcome_message: "String",
    },
  } as const;

  it("exports required functions and keys", () => {
    expect(typeof createAbby).toBe("function");
    expect(typeof useAbby).toBe("function");
    expect(typeof useFeatureFlag).toBe("function");
    expect(typeof useRemoteConfig).toBe("function");
    expect(ABBY_INJECTION_KEY).toBeDefined();
  });

  it("initializes createAbby and provides scoped composables", () => {
    const client = createAbby(sampleConfig);

    expect(client).toBeDefined();
    expect(client.abby).toBeDefined();
    expect(typeof client.useAbby).toBe("function");
    expect(typeof client.useFeatureFlag).toBe("function");
    expect(typeof client.useRemoteConfig).toBe("function");
    expect(typeof client.getABTestValue).toBe("function");
    expect(typeof client.getFeatureFlagValue).toBe("function");
    expect(typeof client.getRemoteConfig).toBe("function");
    expect(typeof client.getVariants).toBe("function");
    expect(typeof client.plugin.install).toBe("function");
  });

  it("resolves test variant and sends ping on useAbby call", () => {
    const client = createAbby(sampleConfig);
    const { variant, onAct } = client.useAbby("button_color");

    expect(["blue", "green"]).toContain(variant.value);
    expect(sendDataSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AbbyEventType.PING,
        data: expect.objectContaining({
          projectId: "proj_test_123",
          testName: "button_color",
          selectedVariant: variant.value,
        }),
      })
    );

    // Test onAct
    onAct();
    expect(sendDataSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AbbyEventType.ACT,
        data: expect.objectContaining({
          projectId: "proj_test_123",
          testName: "button_color",
          selectedVariant: variant.value,
        }),
      })
    );
  });

  it("supports lookupObject mapping with useAbby", () => {
    const client = createAbby(sampleConfig);
    const { variant } = client.useAbby("button_color", {
      blue: "#0000FF",
      green: "#00FF00",
    });

    expect(["#0000FF", "#00FF00"]).toContain(variant.value);
  });

  it("returns feature flag value with useFeatureFlag and getFeatureFlagValue", () => {
    const client = createAbby(sampleConfig);
    const flag = client.useFeatureFlag("dark_mode");

    expect(typeof flag.value).toBe("boolean");
    expect(typeof client.getFeatureFlagValue("dark_mode")).toBe("boolean");
  });

  it("returns remote config with useRemoteConfig and getRemoteConfig", () => {
    const client = createAbby(sampleConfig);
    const msg = client.useRemoteConfig("welcome_message");

    // Initially undefined or string before remote payload
    expect(msg.value === undefined || typeof msg.value === "string").toBe(true);
    const direct = client.getRemoteConfig("welcome_message");
    expect(direct === undefined || typeof direct === "string").toBe(true);
  });

  it("allows installing plugin into a Vue App and using top-level composables", () => {
    const client = createAbby(sampleConfig);
    const app = createApp({});
    app.use(client.plugin);

    let resolvedVariant: any;
    let resolvedFlag: any;

    app.runWithContext(() => {
      const { variant } = useAbby("hero_text");
      const flag = useFeatureFlag("beta_features");
      resolvedVariant = variant.value;
      resolvedFlag = flag.value;
    });

    expect(["original", "variant_b"]).toContain(resolvedVariant);
    expect(typeof resolvedFlag).toBe("boolean");
  });

  it("returns available variants list with getVariants", () => {
    const client = createAbby(sampleConfig);
    const variants = client.getVariants("button_color");
    expect(variants).toEqual(["blue", "green"]);
  });
});
