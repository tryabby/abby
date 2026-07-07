import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";

/**
 * Mounts a throwaway component that runs `composable` inside a real Vue
 * `setup` context (so lifecycle hooks and effect scopes behave normally) and
 * returns its result alongside the mounted wrapper.
 */
export function withSetup<T>(composable: () => T) {
  let result!: T;
  const wrapper = mount(
    defineComponent({
      setup() {
        result = composable();
        return () => h("div");
      },
    })
  );
  return { result, wrapper };
}
