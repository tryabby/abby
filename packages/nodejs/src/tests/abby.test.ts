import { expect, test, describe } from "vitest";
import { createAbby } from "../abby/createAbby";
import flushPromises from "flush-promises";

describe("it works", () => {
  test("getFeatureFlagValue working", async () => {
    const { getFeatureFlagValue } = createAbby({
      projectId: "123",
      tests: {},
      flags: {
        flag1: "Boolean",
        flag2: "Boolean",
      },
    });

    //await abbyInstance initialisation
    await flushPromises();

    expect(await getFeatureFlagValue("flag1")).toBeTruthy();
    expect(await getFeatureFlagValue("flag2")).toBeFalsy();
  });

  test("it returns a correct variant", async () => {
    const variants = ["A", "B", "C", "D"];
    const { getABTestValue } = await createAbby({
      projectId: "123",
      tests: {
        test: {
          variants,
        },
      },
    });

    const variant = getABTestValue("test");

    expect(variant).toContain(variant);
  });

  test("it returns a correct variant with respect to the weights", async () => {
    const variants = ["A", "B"];
    const { getABTestValue } = createAbby({
      projectId: "123",
      tests: {
        test2: {
          variants,
        },
      },
    });

    //await abbyInstance initialisation
    await flushPromises();

    const variant = getABTestValue("test2");

    expect(variant).toBe("A");
  });
});
