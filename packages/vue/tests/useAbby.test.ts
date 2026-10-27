import { AbbyEventType, HttpService } from "@tryabby/core";
import { defineComponent, h } from "vue";
import { render, waitFor } from "@testing-library/vue";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { createAbby } from "../src";

describe("@tryabby/vue integration", () => {
  it("provides useAbby variant and triggers onAct telemetry", async () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { AbbyProvider, useAbby } = createAbby({
      environments: ["test"],
      currentEnvironment: "test",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C", "D"] },
      },
    });

    let capturedOnAct: (() => void) | undefined;
    const Child = defineComponent({
      setup() {
        const { variant, onAct } = useAbby("test");
        capturedOnAct = onAct;
        return () => h("div", { "data-testid": "variant" }, variant.value);
      },
    });

    const Root = defineComponent({
      setup() {
        return () => h(AbbyProvider, null, { default: () => h(Child) });
      },
    });

    const { getByTestId } = render(Root);
    await waitFor(() => {
      expect(["A", "B", "C", "D"]).toContain(getByTestId("variant").textContent);
    });

    capturedOnAct?.();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });

  it("supports useFeatureFlag and useRemoteConfig inside component setup with TypeScript inference", () => {
    const {
      AbbyProvider,
      useAbby,
      useFeatureFlag,
      useRemoteConfig,
      getABTestValue,
      getVariants,
    } = createAbby({
      environments: ["test"],
      currentEnvironment: "test",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
      },
      flags: ["flag1", "flag2"],
      remoteConfig: {
        remoteConfig1: "String",
        maxItems: "Number",
      },
    });

    expect(getVariants("test")).toEqual(["OldFooter", "NewFooter"]);

    const mapped = getABTestValue("test", {
      OldFooter: 10,
      NewFooter: 20,
    });
    expectTypeOf(mapped).toEqualTypeOf<number>();

    const Probe = defineComponent({
      setup() {
        const { variant } = useAbby("test");
        expectTypeOf(variant.value).toEqualTypeOf<"OldFooter" | "NewFooter">();

        const flag = useFeatureFlag("flag1");
        expectTypeOf(flag.value).toEqualTypeOf<boolean>();

        const rcStr = useRemoteConfig("remoteConfig1");
        expectTypeOf(rcStr.value).toEqualTypeOf<string>();

        const rcNum = useRemoteConfig("maxItems");
        expectTypeOf(rcNum.value).toEqualTypeOf<number>();

        return () =>
          h(
            "div",
            { "data-testid": "probe" },
            `${String(flag.value)}-${rcStr.value}-${rcNum.value}`
          );
      },
    });

    const Root = defineComponent({
      setup() {
        return () => h(AbbyProvider, null, { default: () => h(Probe) });
      },
    });

    const { getByTestId } = render(Root);
    expect(getByTestId("probe").textContent).toBe("false--0");
  });
});
