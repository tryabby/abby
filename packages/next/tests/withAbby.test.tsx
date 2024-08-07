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
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {},
      flags: ["flag1"],
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
  });

  it("seeds the flags in development with the cookies", async () => {
    /// @ts-ignore
    process.env.NODE_ENV = "development";
    const { getFeatureFlagValue, withAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {},
      flags: ["flag1"],
    });

    const Component = withAbby(() => <></>);

    // emulate the getInitialProps call
    const props = await (Component as any).getInitialProps({
      Component: () => {},
      ctx: {
        req: {
          headers: {
            cookie: `${ABBY_FF_STORAGE_PREFIX}123_flag1=false;`,
          },
        },
      },
    });

    render(<Component {...props} />);
    expect(getFeatureFlagValue("flag1")).toBe(false);
  });

  it("returns correct value for remoteConfig", async () => {
    const { withAbby, getRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
    });
    const Component = withAbby(() => <></>);

    const props = await (Component as any).getInitialProps({
      Component: () => {},
      ctx: {
        req: {
          headers: {},
        },
      },
    });

    render(<Component {...props} />);
    expect(getRemoteConfig("remoteConfig1")).toBe("FooBar");
  });
});
