import type { Meta, StoryObj } from "@storybook/svelte";

import Devtools from "./Devtools.svelte";

const abbyMock = {
  getConfig: () => ({
    currentEnvironment: "Super Long Environment Name",
  }),
  subscribe: () => () => {},
  getProjectData: () => ({
    flags: {
      "flag-1": true,
      "flag-2": false,
    },
    remoteConfig: {
      "config-1": "string-value",
      "config-2": 42,
      "config-3": { type: "object/json" },
    },
    tests: {
      "test-1": { selectedVariant: "A", variants: ["A", "B"] },
      "test-2": { selectedVariant: "B", variants: ["A", "B"] },
    },
  }),
} as any;

// More on how to set up stories at: https://storybook.js.org/docs/svelte/writing-stories/introduction
const meta = {
  title: "Devtools",
  component: Devtools,
  // tags: ["autodocs"],
  argTypes: {
    position: {
      control: { type: "select" },
      options: ["top-right", "top-left", "bottom-right", "bottom-left"],
      defaultValue: "bottom-right",
    },
  },
} satisfies Meta<Devtools>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/svelte/writing-stories/args
export const Primary: Story = {
  args: {
    abby: abbyMock,
    defaultShow: true,
  },
};
