import type { AbbyDataResponse } from "@tryabby/core";
import { mount } from "@vue/test-utils";
import { type Component, defineComponent } from "vue";

/**
 * Mounts the given provider and calls the composable inside of its slot
 * so that `provide` / `inject` and lifecycle hooks work as expected.
 */
export function renderComposable<T>(
  composable: () => T,
  Provider: Component,
  options: { initialData?: AbbyDataResponse } = {}
) {
  let result!: T;

  const TestComponent = defineComponent({
    setup() {
      result = composable();
      return () => null;
    },
  });

  const wrapper = mount(Provider, {
    props: options.initialData ? { initialData: options.initialData } : {},
    slots: {
      default: TestComponent,
    },
  });

  return { result, wrapper };
}

export function clearCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (!name) continue;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}
