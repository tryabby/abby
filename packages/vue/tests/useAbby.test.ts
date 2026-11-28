import { AbbyEventType, HttpService } from "@tryabby/core";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

const makeAbby = () =>
  createAbby({
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

function mountWith<T>(setup: () => T) {
  let result!: T;
  const wrapper = mount(
    defineComponent({
      setup() {
        result = setup();
        return () => h("div");
      },
    })
  );
  return { result, wrapper };
}

beforeEach(() => {
  document.cookie = "";
  vi.restoreAllMocks();
});

describe("useAbby", () => {
  it("returns a variant that is one of the configured variants", async () => {
    const { useAbby } = makeAbby();
    const { result } = mountWith(() => useAbby("test"));
    await nextTick();

    expect(["OldFooter", "NewFooter"]).toContain(result.variant.value);
  });

  it("is empty before the component is mounted", () => {
    const { useAbby } = makeAbby();
    let beforeMount = "unset";
    mount(
      defineComponent({
        setup() {
          const { variant } = useAbby("test");
          beforeMount = variant.value;
          return () => h("div");
        },
      })
    );

    expect(beforeMount).toBe("");
  });

  it("persists the selected variant", async () => {
    vi.spyOn(TestStorageService, "get").mockReturnValue(null);
    const spy = vi.spyOn(TestStorageService, "set");
    const { useAbby } = makeAbby();
    mountWith(() => useAbby("test"));
    await nextTick();

    expect(spy).toHaveBeenCalled();
  });

  it("uses the persisted value", async () => {
    vi.spyOn(TestStorageService, "get").mockReturnValue("SimonsText");
    const { useAbby } = makeAbby();
    const { result } = mountWith(() => useAbby("test2"));
    await nextTick();

    expect(result.variant.value).toBe("SimonsText");
  });

  it("maps the variant through the lookup object", async () => {
    vi.spyOn(TestStorageService, "get").mockReturnValue("NewFooter");
    const { useAbby } = makeAbby();
    const { result } = mountWith(() =>
      useAbby("test", { OldFooter: "old", NewFooter: "new" })
    );
    await nextTick();

    expect(result.variant.value).toBe("new");
  });

  it("sends a ping for the selected variant and an act event on onAct", async () => {
    vi.spyOn(TestStorageService, "get").mockReturnValue("NewFooter");
    const spy = vi
      .spyOn(HttpService, "sendData")
      .mockImplementation(async () => undefined);
    const { useAbby } = makeAbby();
    const { result } = mountWith(() => useAbby("test"));
    await nextTick();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AbbyEventType.PING,
        data: expect.objectContaining({
          selectedVariant: "NewFooter",
          testName: "test",
        }),
      })
    );

    result.onAct();
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });
});
