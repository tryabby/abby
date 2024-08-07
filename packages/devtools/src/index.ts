import type { ComponentProps } from "svelte";
import DevtoolsComponent from "./Devtools.svelte";

export class DevtoolsFactory {
  create(props: AbbyDevtoolProps) {
    const component = new DevtoolsComponent({
      target: document.body,
      props,
    });

    return () => {
      component?.$destroy();
    };
  }
}

export default new DevtoolsFactory();

export type AbbyDevtoolProps = ComponentProps<DevtoolsComponent>;
