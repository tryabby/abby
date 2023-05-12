import { renderHook, act, waitFor } from "@testing-library/react";
import { PropsWithChildren } from "react";
import { AbbyEventType } from "shared";
import { createAbby } from "../src";
import { HttpService } from "shared/src/http";
import { TestStorageService } from "../src/StorageService";

const OLD_ENV = process.env;

beforeEach(() => {
  document.cookie = "";
  vi.resetModules(); // Most important - it clears the cache
  process.env = { ...OLD_ENV }; // Make a copy
});

afterAll(() => {
  process.env = OLD_ENV; // Restore old environment
});

describe("useAbby", () => {
  it("returns the correct amount of options", () => {
    const spy = vi.spyOn(TestStorageService, "set");

    const { AbbyProvider, useAbby } = createAbby({
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
        test2: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
    });

    const wrapper = ({ children }: PropsWithChildren) => (
      <AbbyProvider>{children}</AbbyProvider>
    );

    const { result } = renderHook(() => useAbby("test"), {
      wrapper,
    });

    expect(spy).toHaveBeenCalled();
    expect(result.current.variant).toBeDefined();
  });

  it("should use the persistedValue", () => {
    const persistedValue = "SimonsText";
    const variants = ["SimonsText", "MatthiasText", "TomsText", "TimsText"];

    const getSpy = vi.spyOn(TestStorageService, "get");
    const setSpy = vi.spyOn(TestStorageService, "set");

    getSpy.mockReturnValue(persistedValue);

    const { AbbyProvider, useAbby } = createAbby({
      projectId: "123",
      tests: {
        test: { variants },
      },
    });

    const wrapper = ({ children }: PropsWithChildren) => (
      <AbbyProvider>{children}</AbbyProvider>
    );

    const { result } = renderHook(() => useAbby("test"), {
      wrapper,
    });

    // the stored value should not be overwritten
    expect(setSpy).not.toHaveBeenCalled();

    // value set in localstorage
    expect(result.current.variant).toEqual(persistedValue);
  });

  it("should ping the current info on mount", () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { AbbyProvider, useAbby } = createAbby({
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    const wrapper = ({ children }: PropsWithChildren) => (
      <AbbyProvider>{children}</AbbyProvider>
    );

    renderHook(() => useAbby("test"), {
      wrapper,
    });

    act(() => {
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: AbbyEventType.PING })
      );
    });
  });

  it("should notify the server with onAct", () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { AbbyProvider, useAbby } = createAbby({
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    const wrapper = ({ children }: PropsWithChildren) => (
      <AbbyProvider>{children}</AbbyProvider>
    );

    const { result } = renderHook(() => useAbby("test"), {
      wrapper,
    });

    act(() => {
      result.current.onAct();
    });

    // first call is tested above
    expect(spy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });

  it("should return the correct feature flags", () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      projectId: "123",
      flags: ["flag1", "flag2"],
    });

    const wrapper = ({ children }: PropsWithChildren) => (
      <AbbyProvider>{children}</AbbyProvider>
    );

    const { result: flag1 } = renderHook(() => useFeatureFlag("flag1"), {
      wrapper,
    });

    // wait for the flag to be fetched
    waitFor(() => expect(flag1.current).toEqual(true));

    const { result: flag2 } = renderHook(() => useFeatureFlag("flag2"), {
      wrapper,
    });

    expect(flag2.current).toEqual(false);
  });

  it("should respect the default values for feature flags", () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
      settings: {
        flags: {
          default: true,
        },
      },
    });

    const wrapper = ({ children }: PropsWithChildren) => (
      <AbbyProvider>{children}</AbbyProvider>
    );

    const { result: flag2 } = renderHook(() => useFeatureFlag("flag2"), {
      wrapper,
    });

    expect(flag2.current).toEqual(true);

    // wait for the flag to be fetched
    waitFor(() => expect(flag2.current).toEqual(false));
  });

  it("uses the devOverrides", () => {
    process.env.NODE_ENV = "development";
    const { AbbyProvider, useFeatureFlag } = createAbby({
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
      settings: {
        flags: {
          devOverrides: {
            flag1: false,
            flag2: true,
          },
        },
      },
    });

    const wrapper = ({ children }: PropsWithChildren) => (
      <AbbyProvider>{children}</AbbyProvider>
    );

    const { result: flag1 } = renderHook(() => useFeatureFlag("flag1"), {
      wrapper,
    });

    expect(flag1.current).toEqual(false);

    // will stay false and won't be overwritten by a fetch
    waitFor(() => expect(flag1.current).toEqual(false));

    const { result: flag2 } = renderHook(() => useFeatureFlag("flag2"), {
      wrapper,
    });

    expect(flag2.current).toEqual(true);

    // will stay true and won't be overwritten by a fetch
    waitFor(() => expect(flag2.current).toEqual(true));
  });

  it("gets the stored feature flag value using a function properly", () => {
    const { getFeatureFlagValue } = createAbby({
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
    });

    // await server fetch
    waitFor(() => expect(getFeatureFlagValue("flag1")).toEqual(true));
    expect(getFeatureFlagValue("flag2")).toEqual(false);
  });

  it("returns the correct possible variant values", () => {
    const { getVariants } = createAbby({
      projectId: "123",
      currentEnvironment: "a",
      tests: {
        test: {
          variants: ["A", "B", "C"],
        },
      },
    });
    expect(getVariants("test")).toEqual(["A", "B", "C"]);
  });
});
