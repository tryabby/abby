import { AbbyEventType, HttpService } from "@tryabby/core";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { createApp } from "vue";
import { createAbby } from "../src";

const createTestAbby = () =>
  createAbby({
    projectId: "project",
    currentEnvironment: "dev",
    environments: ["dev"],
    tests: {
      buttonCopy: {
        variants: ["control", "short"],
      },
    },
    flags: ["checkout"],
    remoteConfig: {
      headline: "String",
      retryCount: "Number",
    },
    settings: {
      flags: {
        fallbackValues: {
          checkout: true,
        },
      },
      remoteConfig: {
        fallbackValues: {
          headline: "Hello",
          retryCount: 3,
        },
      },
    },
  });

describe("createAbby for Vue", () => {
  it("exposes typed Vue composables from a provider", async () => {
    const abby = createTestAbby();
    const observed: {
      variant?: string;
      lookup?: "Control copy" | "Short copy";
      flag?: boolean;
      headline?: string;
      retryCount?: number;
    } = {};

    const Consumer = defineComponent({
      setup() {
        const { variant } = abby.useAbby("buttonCopy");
        const { variant: lookupVariant } = abby.useAbby("buttonCopy", {
          control: "Control copy",
          short: "Short copy",
        } as const);
        const flag = abby.useFeatureFlag("checkout");
        const headline = abby.useRemoteConfig("headline");
        const retryCount = abby.useRemoteConfig("retryCount");

        observed.variant = variant.value;
        observed.lookup = lookupVariant.value;
        observed.flag = flag.value;
        observed.headline = headline.value;
        observed.retryCount = retryCount.value;

        return () => h("div");
      },
    });

    const root = document.createElement("div");
    createApp({
      render: () =>
        h(
          abby.AbbyProvider,
          {
            initialData: {
              tests: [{ name: "buttonCopy", weights: [1, 0] }],
              flags: [{ name: "checkout", value: true }],
              remoteConfig: [
                { name: "headline", value: "Hello" },
                { name: "retryCount", value: 3 },
              ],
            },
          },
          () => h(Consumer)
        ),
    }).mount(root);
    await nextTick();

    expect(["control", "short"]).toContain(observed.variant);
    expect(["Control copy", "Short copy"]).toContain(observed.lookup);
    expect(observed.flag).toBe(true);
    expect(observed.headline).toBe("Hello");
    expect(observed.retryCount).toBe(3);
  });

  it("sends an ACT event for the selected variant", async () => {
    const abby = createTestAbby();
    const sendData = vi.spyOn(HttpService, "sendData").mockResolvedValue();
    let onAct: (() => void) | undefined;

    const Consumer = defineComponent({
      setup() {
        onAct = abby.useAbby("buttonCopy").onAct;
        return () => h("div");
      },
    });

    const root = document.createElement("div");
    createApp({
      render: () => h(abby.AbbyProvider, null, () => h(Consumer)),
    }).mount(root);
    await nextTick();

    onAct?.();

    expect(sendData).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AbbyEventType.ACT,
        data: expect.objectContaining({
          projectId: "project",
          testName: "buttonCopy",
        }),
      })
    );
  });

  it("keeps public types narrowed to config keys and values", () => {
    const abby = createTestAbby();

    expectTypeOf(abby.useAbby).parameter(0).toEqualTypeOf<"buttonCopy">();
    expectTypeOf(abby.useFeatureFlag).parameter(0).toEqualTypeOf<"checkout">();
    expectTypeOf(abby.useRemoteConfig)
      .parameter(0)
      .toEqualTypeOf<"headline" | "retryCount">();
    expectTypeOf(abby.getRemoteConfig("retryCount")).toEqualTypeOf<number>();
  });
});
