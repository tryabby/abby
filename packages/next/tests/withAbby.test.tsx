import { render } from "@testing-library/react";
import { createAbby } from "../src";
import { ABBY_FF_STORAGE_PREFIX } from "@tryabby/core";
const OLD_ENV = process.env;

beforeEach(() => {
  vi.resetModules(); // Most important - it clears the cache
  process.env = { ...OLD_ENV }; // Make a copy
});

afterAll(() => {
  process.env = OLD_ENV; // Restore old environment
});

describe("withAbby", () => {
  it("works properly", async () => {
    const { getFeatureFlagValue, withAbby } = createAbby({
      environments: [],
      projectId: "123",
      tests: {},
      flags: { flag1: "Boolean", flag2: "String" },
    });

    const Component = withAbby(() => <></>);

    // emulate the getInitialProps call
    const props = await (Component as any).getInitialProps({
      Component: () => {},
      ctx: {
        req: {
          headers: {},
        },
      },
    });

    render(<Component {...props} />);
    expect(getFeatureFlagValue("flag1")).toBe(true);
    expect(getFeatureFlagValue("flag2")).toBe("test");
  });

  it("seeds the flags in development with the cookies", async () => {
    /// @ts-ignore
    process.env.NODE_ENV = "development";
    const { getFeatureFlagValue, withAbby } = createAbby({
      environments: [],
      projectId: "123",
      tests: {},
      flags: { flag1: "Boolean", flag2: "String" },
    });

    const Component = withAbby(() => <></>);

    // emulate the getInitialProps call
    const props = await (Component as any).getInitialProps({
      Component: () => {},
      ctx: {
        req: {
          headers: {
            cookie: `${ABBY_FF_STORAGE_PREFIX}123_flag1=false; ${ABBY_FF_STORAGE_PREFIX}123_flag2=test`,
          },
        },
      },
    });

    render(<Component {...props} />);
    expect(getFeatureFlagValue("flag1")).toBe(false);
    expect(getFeatureFlagValue("flag2")).toBe("test");
  });
});
