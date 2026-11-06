import {
  type AbbyDataResponse,
  AbbyEventType,
  HttpService,
} from "@tryabby/core";
import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { createAbby } from "../src";

const initialData: AbbyDataResponse = {
  tests: [{ name: "checkout", weights: [0, 1] }],
  flags: [{ name: "newNav", value: true }],
  remoteConfig: [{ name: "headline", value: "Ship faster" }],
};

function createSdk() {
  return createAbby({
    projectId: "vue-test",
    environments: ["test"],
    currentEnvironment: "test",
    cookies: { disableByDefault: true },
    tests: {
      checkout: { variants: ["control", "streamlined"] },
    },
    flags: ["newNav"],
    remoteConfig: {
      headline: "String",
    },
  });
}

describe("@tryabby/vue", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes the selected variant and sends PING and ACT events", async () => {
    const sendData = vi
      .spyOn(HttpService, "sendData")
      .mockResolvedValue(undefined as never);
    const sdk = createSdk();
    const Consumer = defineComponent({
      setup() {
        return sdk.useAbby("checkout");
      },
      template: '<button @click="onAct">{{ variant }}</button>',
    });

    const wrapper = mount(sdk.AbbyProvider, {
      props: { initialData },
      slots: { default: Consumer },
    });
    await nextTick();

    expect(wrapper.text()).toBe("streamlined");
    expect(sendData).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.PING })
    );

    await wrapper.get("button").trigger("click");
    expect(sendData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: AbbyEventType.ACT,
        data: expect.objectContaining({
          projectId: "vue-test",
          testName: "checkout",
          selectedVariant: "streamlined",
        }),
      })
    );
  });

  it("reacts to core feature-flag and remote-config updates", async () => {
    vi.spyOn(HttpService, "sendData").mockResolvedValue(undefined as never);
    const sdk = createSdk();
    const Consumer = defineComponent({
      setup() {
        const client = sdk.useAbbyClient();
        return {
          client,
          flag: sdk.useFeatureFlag("newNav"),
          headline: sdk.useRemoteConfig("headline"),
        };
      },
      template:
        '<div><span class="flag">{{ flag }}</span><span class="headline">{{ headline }}</span></div>',
    });

    const wrapper = mount(sdk.AbbyProvider, {
      props: { initialData },
      slots: { default: Consumer },
    });

    expect(wrapper.get(".flag").text()).toBe("true");
    expect(wrapper.get(".headline").text()).toBe("Ship faster");

    const consumer = wrapper.findComponent(Consumer);
    consumer.vm.client.updateFlag("newNav", false);
    consumer.vm.client.updateRemoteConfig("headline", "Updated");
    await nextTick();

    expect(wrapper.get(".flag").text()).toBe("false");
    expect(wrapper.get(".headline").text()).toBe("Updated");
  });

  it("requires composables to use their matching provider", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const sdk = createSdk();
    const Consumer = defineComponent({
      setup() {
        sdk.useFeatureFlag("newNav");
        return () => null;
      },
    });

    expect(() => mount(Consumer)).toThrow(
      "Abby composables must be used inside this createAbby's AbbyProvider."
    );
  });
});
