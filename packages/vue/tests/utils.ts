import { type AbbyDataResponse, getABStorageKey } from "@tryabby/core";
import { mount } from "@vue/test-utils";
import { type Plugin, defineComponent } from "vue";

export const initialData: AbbyDataResponse = {
  tests: [{ name: "test", weights: [1, 0, 0] }],
  flags: [
    { name: "flag1", value: true },
    { name: "flag2", value: false },
  ],
  remoteConfig: [
    { name: "text", value: "Hello" },
    { name: "count", value: 42 },
  ],
};

/**
 * Runs a composable inside the setup of a component that is mounted
 * in an app with the given plugin installed.
 */
export function withSetup<T>(
  composable: () => T,
  plugin: Plugin<[options?: { initialData?: AbbyDataResponse }]>,
  options?: { initialData?: AbbyDataResponse }
) {
  let result!: T;

  const wrapper = mount(
    defineComponent({
      setup() {
        result = composable();
        return () => null;
      },
    }),
    { global: { plugins: [[plugin, options]] } }
  );

  return { result, wrapper };
}

export function setStoredVariant(
  projectId: string,
  testName: string,
  variant: string
) {
  document.cookie = `${getABStorageKey(projectId, testName)}=${variant}`;
}
